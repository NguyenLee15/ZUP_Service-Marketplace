<!-- FILE: 08_UC_CHAT_AI.md | SCOPE: UC18 Chat System (WebSocket · Attachment · Read Receipt · AI Chatbot) · UC19 Thông báo -->

## UC18 – GIAO TIẾP VÀ AI CHATBOT {#uc18}

> **Phần này là system design, không phải feature description.** Mỗi quyết định kiến trúc đều có lý do và tradeoff rõ ràng.

### Tóm tắt thiết kế (đọc nhanh — đủ để trả lời hội đồng)

**Chat System — 3 điểm cốt lõi:**
- Message schema: `sender_type: CUSTOMER | PROVIDER | AI` · `is_read: BOOLEAN` (DB thực tế) — `message_type: text | image | file` và `status: sent | delivered | seen` là đề xuất mở rộng, chưa có trong DB schema hiện tại
- Scaling: `Socket.io → Redis Pub/Sub (Upstash) → multi-node fanout` — mỗi node subscribe channel `conv:{id}`, message từ bất kỳ node nào đều reach đúng client
- Storage: Cloudinary (`resource_type: 'auto'`) cho attachment · pre-signed URL TTL 15 phút · virus scan async trước khi tin nhắn được gửi

**Payment — 1 câu đủ nâng level:**
> *"Hệ thống áp dụng mô hình thanh toán trực tiếp: KH thanh toán tiền dịch vụ cho NCC ngoài nền tảng. Nền tảng chỉ quản lý ví NCC (đặt cọc uy tín) và thu hoa hồng tự động sau khi đơn hoàn thành. Nếu NCC vi phạm, nền tảng trừ ví hoặc khóa tài khoản — không cần giữ tiền KH."*

**AI — Scoring function thực tế:**
```
final_score = w1 * semantic_similarity   // pgvector cosine, weight 0.35
            + w2 * rating_score          // avg_rating / 5.0,  weight 0.25
            + w3 * completion_rate       // completed / total,  weight 0.20
            + w4 * proximity_score       // 1 - dist_km/15,    weight 0.15
            + w5 * recency_score         // mới tham gia,      weight 0.05
            × urgency_multiplier         // 1.3 nếu "gấp/khẩn"

AI layer = NLP intent extraction (Gemini 2.5 Flash) + rule-based ranking + pgvector retrieval
Fallback: pgvector lỗi → PostgreSQL LIKE query (< 5 giây timeout)
```

---

---

### Architecture Decision Records (ADR)

**ADR-01: Sticky Session vs Stateless WebSocket**

**Quyết định: Sticky Session** (nginx `ip_hash` hoặc cookie `X-WS-Node`).

| | Sticky Session ✅ | Stateless WS |
|---|---|---|
| Room management | In-memory per node, đơn giản | Cần shared session store (Redis) |
| Node failure | Client reconnect → node mới (có FS03) | Transparent failover |
| Complexity | Thấp | Cao hơn |
| Scale target | Tốt đến ~5 node | Cần khi > 5 node |

Redis Pub/Sub vẫn cần — không để route session mà để **fanout message** giữa nodes.

**ADR-02: Attachment Storage**

**Quyết định: Cloudinary (`resource_type: 'auto'`)**

```
Bucket structure:
  cloudinary upload folders:
  chat/
  │   ├── {conversation_id}/
  │   │   ├── {YYYY}/{MM}/
  │   │   │   ├── {uuid}.jpg          ← original
  │   │   │   ├── {uuid}_thumb.jpg    ← thumbnail 200x200
  │   │   │   └── {uuid}_preview.jpg  ← preview 800px wide
  ├── kyc/
  │   └── {user_id}/
  │       └── {uuid}.jpg
  └── service-images/
      └── {service_id}/
          └── {uuid}.jpg

Access policy:
  - chat/*        : PRIVATE — chỉ qua pre-signed URL, TTL 15 phút
  - kyc/*         : PRIVATE — pre-signed URL TTL 1 giờ, chỉ Admin/Staff
  - service-images/*: PUBLIC-READ — qua CDN
```

**ADR-03: CDN**

- `service-images/` và thumbnail chat → có thể serve qua Cloudinary CDN (public transformation URL)
- Ảnh gốc chat → không qua CDN, luôn dùng pre-signed URL trực tiếp từ Cloudinary (private delivery, TTL 15 phút)
- Lý do: ảnh chat là bằng chứng pháp lý, phải access-controlled

**ADR-04: Typing Indicator**

**Quyết định: Redis key với TTL** (không lưu DB)

```
Key: typing:{conversation_id}:{user_id}
Value: "1"
TTL: 3 giây

Flow:
  KH đang gõ → client gửi WS event {type:"typing_start"}
    → Server: SET typing:{conv_id}:{user_id} 1 EX 3
    → PUBLISH conv:{conv_id} {type:"typing", user_id, typing: true}

  KH dừng gõ 3 giây → Redis key expire tự nhiên
    → Không cần gửi "typing_stop" (client tự biết qua TTL)

  KH gửi tin nhắn → DEL typing:{conv_id}:{user_id}
    → PUBLISH {type:"typing", typing: false}
```

---

### Schema đầy đủ

> ⚠️ **Lưu ý:** Phần schema dưới đây mô tả **thiết kế đề xuất mở rộng** cho hệ thống chat đầy đủ tính năng. Schema DB thực tế hiện tại sử dụng: bảng `conversations` và `messages` (theo `database_schema_md.txt`), file đính kèm booking dùng `booking_attachments` (type: SURVEY|RESULT), file bằng chứng tranh chấp dùng `dispute_evidences`. Các bảng `attachments`, `conversation_members`, `read_receipts` là đề xuất — chưa có trong DB schema hiện tại.

```sql
-- Conversations: 1 booking = 1 conversation
CREATE TABLE conversations (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id   UUID REFERENCES bookings(id) UNIQUE,
    customer_id  UUID REFERENCES users(id),
    provider_id  UUID REFERENCES users(id),
    created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Messages (khớp với DB schema bảng 3.82)
-- sender_type: CUSTOMER | PROVIDER | AI (enum SenderType)
-- is_read: BOOLEAN (theo DB thực tế)
CREATE TABLE messages (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES conversations(id) NOT NULL,
    sender_id       UUID REFERENCES users(id) NOT NULL,
    sender_role     VARCHAR(20) NOT NULL,
    -- 'customer' | 'provider' | 'ai_bot' | 'system'
    message_type    VARCHAR(20) NOT NULL DEFAULT 'text',
    -- 'text' | 'image' | 'video' | 'file' | 'system_event'
    content         TEXT,               -- null nếu là attachment-only
    attachment_id   UUID REFERENCES attachments(id),  -- null nếu là text
    client_msg_id   UUID UNIQUE,        -- idempotency key từ client
    is_read         BOOLEAN DEFAULT FALSE,  -- matches messages.is_read in actual DB schema
    is_ai_generated BOOLEAN DEFAULT FALSE,
    delivered_at    TIMESTAMPTZ,        -- server nhận và lưu DB thành công
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT content_or_attachment CHECK (
        content IS NOT NULL OR attachment_id IS NOT NULL
    )
);
CREATE INDEX idx_msg_conv_created ON messages(conversation_id, created_at DESC);

-- Read receipts: seen status
CREATE TABLE read_receipts (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id      UUID REFERENCES conversations(id),
    user_id              UUID REFERENCES users(id),
    last_read_message_id UUID REFERENCES messages(id),
    seen_at              TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(conversation_id, user_id)
);

-- Attachments: metadata tách riêng, file lưu Cloudinary (đề xuất mở rộng)
CREATE TABLE attachments (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    uploader_id       UUID REFERENCES users(id),
    conversation_id   UUID REFERENCES conversations(id),
    original_filename VARCHAR(255) NOT NULL,
    stored_key        TEXT NOT NULL,          -- Cloudinary public_id: chat/{conv_id}/{YYYY}/{MM}/{uuid}
    thumb_key         TEXT,                   -- Cloudinary public_id thumbnail (null nếu không phải ảnh)
    preview_key       TEXT,                   -- Cloudinary public_id preview size
    mime_type         VARCHAR(100) NOT NULL,
    file_size_bytes   BIGINT NOT NULL,
    status            VARCHAR(20) DEFAULT 'pending',
    -- 'pending'   : đang upload
    -- 'scanning'  : đang virus scan
    -- 'ready'     : sẵn sàng gửi tin
    -- 'infected'  : bị xóa do malware
    -- 'failed'    : upload thất bại
    virus_scan_result VARCHAR(20),  -- 'clean' | 'infected' | null
    created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- Unread counts: cache counter, tránh COUNT(*) mỗi lần
CREATE TABLE conversation_members (
    conversation_id UUID REFERENCES conversations(id),
    user_id         UUID REFERENCES users(id),
    unread_count    INT DEFAULT 0,
    last_seen_at    TIMESTAMPTZ,
    PRIMARY KEY(conversation_id, user_id)
);
```

**File type policy theo chat (vs KYC):**

| Type | Chat | KYC | Service Images |
|---|---|---|---|
| JPG/PNG | ✅ ≤ 10MB | ✅ ≤ 5MB | ✅ ≤ 5MB |
| PDF | ✅ ≤ 10MB | ✅ ≤ 5MB | ❌ |
| MP4/MOV | ✅ ≤ 50MB, ≤ 60s | ❌ | ❌ |
| GIF | ✅ ≤ 5MB | ❌ | ❌ |
| ZIP/EXE | ❌ | ❌ | ❌ |

---

### Kiến trúc Multi-Server WebSocket

```
                    ┌──────────────────────┐
                    │    LOAD BALANCER      │
                    │  nginx ip_hash        │
                    │  (sticky session)     │
                    └──────┬───────┬────────┘
                           │       │
              ┌────────────▼─┐   ┌─▼────────────┐
              │  WS Node 1   │   │  WS Node 2   │
              │              │   │              │
              │ KH connects  │   │ NCC connects │
              │ room: conv_X │   │ room: conv_X │
              └──────┬───────┘   └──────┬───────┘
                     │                  │
                     │  PUBLISH         │  SUBSCRIBE
                     └────────┬─────────┘
                              │
                    ┌─────────▼────────┐
                    │   Redis Pub/Sub   │
                    │                  │
                    │ Channel: conv:{id}│
                    │                  │
                    │ Khi Node 1 nhận   │
                    │ message từ KH:   │
                    │ PUBLISH conv:X   │
                    │ → Node 2 nhận    │
                    │ → push đến NCC  │
                    └──────────────────┘

Tại sao cần Redis Pub/Sub dù dùng sticky session?
→ KH reconnect sau node failure → có thể vào Node 2 (ip_hash thay đổi khi node chết)
→ Nếu không có Pub/Sub: NCC ở Node 1, KH mới vào Node 2 → không nhận được tin
→ Redis Pub/Sub đảm bảo mọi message đều reach đúng client bất kể node nào
```

**Reconnect strategy:** Exponential backoff — 1s → 2s → 4s → 8s → 30s (max). Sau reconnect: client gửi `last_received_id` để server push lại tin bị miss.

**Sync message khi reconnect:**

```
Client sau reconnect gửi:
  {type: "sync", last_received_id: "uuid-of-last-msg"}

Server:
  SELECT id, sender_id, message_type, content, attachment_id,
         delivered_at, created_at
  FROM messages
  WHERE conversation_id = :conv_id
    AND created_at > (SELECT created_at FROM messages WHERE id = :last_received_id)
  ORDER BY created_at ASC
  LIMIT 100;

→ Push batch về client theo thứ tự
```

---

### UC18.1 – Gửi và nhận tin nhắn (text)

**Actor:** Khách hàng, Nhà cung cấp | **Priority:** Cao

**Implementation:** Socket.io + `WsGuard` (xác thực JWT từ `handshake.headers.authorization`)

**Luồng kỹ thuật:**

```
1. WS Handshake:
   Client → Server: GET /ws?token=JWT
   Server: Decode JWT → validate → check conversation membership
   Nếu invalid → đóng kết nối với code 4001 (không để idle)

2. Gửi tin nhắn:
   Client → {type:"msg", client_msg_id: UUIDv4, content:"...", message_type:"text"}

3. Server xử lý:
   a. Rate limit check: sliding window 30 msg/min/user (Redis counter)
      Vượt → send {type:"error", code:"rate_limit"}, không đóng kết nối
   b. Validate content length ≤ 2000 chars
   c. INSERT INTO messages ... ON CONFLICT (client_msg_id) DO NOTHING RETURNING id
      → conflict: tin đã tồn tại → trả ACK với id cũ
      → no conflict: tin mới → tiếp tục
   d. SET delivered_at = NOW() trong cùng INSERT
   e. PUBLISH conv:{id} → {type:"msg", message_id, sender_id, content, delivered_at}
   f. Tăng unread_count của đối phương:
      UPDATE conversation_members SET unread_count = unread_count + 1
      WHERE conversation_id = ? AND user_id = :other_party

4. Client nhận ACK:
   {type:"msg_ack", client_msg_id, server_message_id, delivered_at}
   → Cập nhật UI: "✓ Đã gửi"
```

**Heartbeat:**
- Server → Client: `ping` mỗi 30 giây
- Client không `pong` trong 60 giây → Server đóng kết nối + DEL typing key + cleanup Redis subscription

**Business Rules:**
- BR1: JWT validate tại handshake; reject với close code 4001 nếu invalid
- BR2: Rate limit 30 msg/phút/user — sliding window trong Redis
- BR3: Max 2.000 ký tự/tin nhắn text
- BR4: `delivered_at` set ngay khi server persist vào DB
- BR5: Tin nhắn immutable sau khi gửi — không có edit/delete
- BR6: Chỉ 2 actor trong `conversations` được gửi/nhận

---

### UC18.1b – Attachment trong Chat

**File type policy:** Xem bảng ở phần Schema.

**Luồng 2 bước (HTTP upload + WS send):**

```
BƯỚC 1 — Upload (HTTP POST /attachments/chat):
  Client gửi multipart: file + conversation_id

  Server:
    a. Validate: file type (whitelist), size limit, conversation membership
    b. INSERT attachments (status='pending', stored_key=generated_s3_key)
    c. Upload lên Cloudinary: cloudinary.upload() → lưu public_id vào stored_key
       Nếu fail → UPDATE attachments SET status='failed' → trả lỗi (FS04)
    d. Nếu là ảnh: enqueue thumbnail_job (async)
       Worker: tạo thumbnail 200x200 + preview 800px → upload Cloudinary → update thumb_key, preview_key
    e. Enqueue virus_scan_job (async)
       Worker: scan file → UPDATE attachments SET
         status = CASE WHEN infected THEN 'infected' ELSE 'ready' END,
         virus_scan_result = ...
    f. Trả ngay: {attachment_id, status:'scanning'}
       (Client poll GET /attachments/{id}/status hoặc nhận WS event khi ready)

BƯỚC 2 — Gửi tin nhắn (WebSocket sau khi status='ready'):
  Client: {type:"msg", client_msg_id, message_type:"image", attachment_id: UUID}

  Server:
    a. SELECT * FROM attachments WHERE id = ? AND uploader_id = ? AND status = 'ready'
       → Nếu không tìm thấy hoặc status != 'ready' → {type:"error", code:"attachment_not_ready"}
    b. INSERT messages (message_type='image', attachment_id, content=null)
    c. PUBLISH + broadcast bình thường
```

**Pre-signed URL cho xem ảnh:**

```
Client muốn xem ảnh trong tin nhắn:
  GET /attachments/{id}/url

Server:
  1. Kiểm tra user là thành viên conversation
  2. Kiểm tra attachments.status = 'ready'
  3. Generate pre-signed URL:
     - Original: Cloudinary signed_url({stored_key}, expires=900)    ← 15 phút
     - Thumbnail: Cloudinary signed_url({thumb_key}, expires=900)
  4. Trả {original_url, thumb_url, preview_url}

Client cache URL trong 14 phút (1 phút trước expire thì gọi lại)
```

**Xử lý file infected:**
```
Sau khi scan → infected:
  - UPDATE attachments SET status = 'infected'
  - Xóa resource trên Cloudinary
  - Nếu tin nhắn đã gửi: UPDATE messages SET content = '[File bị xóa do vi phạm chính sách]',
                                              attachment_id = NULL
  - Push WS event {type:"msg_update", message_id, content:'[File bị xóa...]'}
  - Ghi alert cho Admin (UC19 BR17)
```

**Business Rules:**
- BR1: Upload validate whitelist MIME type (không tin vào extension), max size theo loại
- BR2: Thumbnail và preview tạo async, không block upload response
- BR3: Virus scan async; file không ready cho đến khi scan = 'clean'
- BR4: Pre-signed URL TTL 15 phút; client phải refresh khi hết hạn
- BR5: File chat giữ vĩnh viễn (là bằng chứng pháp lý); chỉ xóa khi infected
- BR6: Cloudinary folder structure: `chat/{conversation_id}/{YYYY}/{MM}/{uuid}`

---

### UC18.1c – Read Receipt / Seen Status / Unread Count

**seen_at vs delivered_at:**

| Field | Ý nghĩa | Lưu ở đâu |
|---|---|---|
| `delivered_at` | Server nhận và lưu DB thành công | `messages.delivered_at` |
| `seen_at` | Người nhận đã nhìn thấy trên màn hình | `read_receipts.seen_at` |

**Cập nhật seen_at:**

```
Trigger: User mở conversation, hoặc cuộn đến tin mới nhất, hoặc app vào foreground
Client gửi: {type:"read", conversation_id, last_read_message_id}
Debounce: tối thiểu 2 giây giữa 2 lần gửi cùng conversation

Server:
  INSERT INTO read_receipts (conversation_id, user_id, last_read_message_id, seen_at)
  VALUES (?, ?, ?, NOW())
  ON CONFLICT (conversation_id, user_id)
  DO UPDATE SET
    last_read_message_id = EXCLUDED.last_read_message_id,
    seen_at              = EXCLUDED.seen_at
  WHERE read_receipts.last_read_message_id < EXCLUDED.last_read_message_id;
  -- Chỉ update nếu message mới hơn (không được giảm last_read)

  Sau đó:
  UPDATE conversation_members SET unread_count = 0, last_seen_at = NOW()
  WHERE conversation_id = ? AND user_id = ?

  PUBLISH conv:{id}:
    {type:"seen", user_id, last_read_message_id, seen_at}
```

**Logic hiển thị phía client:**

```javascript
// Với mỗi tin nhắn tôi đã gửi:
function getMessageStatus(message, otherPartyReceipt) {
  if (!message.delivered_at) return "⌛ Đang gửi";

  if (!otherPartyReceipt) return "✓ Đã gửi";

  if (message.id <= otherPartyReceipt.last_read_message_id) {
    return `✓✓ Đã xem lúc ${format(otherPartyReceipt.seen_at)}`;
  }

  return "✓ Đã gửi";
}
```

**Unread Count:**

```
Tăng khi: server nhận message mới → UPDATE conversation_members SET unread_count += 1
           (chỉ tăng cho đối phương, không tăng cho người gửi)

Giảm về 0: khi user gửi {type:"read"} → UPDATE SET unread_count = 0

Hiển thị: Badge trên icon chat = SUM(unread_count) across all conversations của user
  → Cache trong Redis: "unread:{user_id}" = total count
  → Invalidate khi có thay đổi
```

**Typing Indicator:**

```
Client đang gõ:
  → Gửi {type:"typing_start"} (debounce: chỉ gửi khi bắt đầu, không gửi liên tục)
  → Server: SET typing:{conv_id}:{user_id} 1 EX 3
  → PUBLISH conv:{id}: {type:"typing", user_id, is_typing: true}

Client nhận được typing event:
  → Hiển thị "... đang gõ"

Sau 3 giây không nhận thêm typing_start:
  → Ẩn "... đang gõ" (Redis key đã expire, không cần server push stop event)

Client gửi tin nhắn:
  → DEL typing:{conv_id}:{user_id}
  → PUBLISH {type:"typing", user_id, is_typing: false}
```

---

### UC18.2 – Xem lịch sử hội thoại

**Cursor-based pagination:**

```sql
-- Load ban đầu (50 tin nhắn mới nhất):
SELECT m.*, a.thumb_key, a.mime_type
FROM messages m
LEFT JOIN attachments a ON a.id = m.attachment_id
WHERE m.conversation_id = :conv_id
ORDER BY m.created_at DESC
LIMIT 50;
-- Client reverse để hiển thị cũ → mới

-- Load thêm (cuộn lên):
SELECT m.*, a.thumb_key, a.mime_type
FROM messages m
LEFT JOIN attachments a ON a.id = m.attachment_id
WHERE m.conversation_id = :conv_id
  AND m.created_at < :cursor   -- cursor = created_at của tin cũ nhất đang hiển thị
ORDER BY m.created_at DESC
LIMIT 50;
```

**Lý do cursor-based > offset:** Khi đang cuộn xem cũ, có tin nhắn mới liên tục thêm vào — OFFSET sẽ skip hoặc trùng. Cursor-based dùng `created_at` làm anchor ổn định.

---

### UC18.3 – AI Chatbot

**Kích hoạt:** NCC offline (`provider_online = FALSE` trong Redis hash `online_users`).

**NCC online detection:**

```
NCC kết nối WS → HSET online_users {provider_id} {node_id}
NCC disconnect   → HDEL online_users {provider_id}
Heartbeat timeout→ HDEL online_users {provider_id}

Check: HEXISTS online_users {provider_id}
```

**AI Worker flow:**

```
KH gửi tin → Server check: HEXISTS online_users {provider_id}
→ FALSE (offline) → enqueue ai_chat_job vào BullMQ queue

AI Worker:
1. Lấy 20 tin nhắn gần nhất của conversation
2. Lấy service description của NCC (cache Redis 1h, fallback DB)
3. Truncate description xuống ≤ 500 tokens nếu cần
4. Build prompt:

   SYSTEM: Bạn là trợ lý AI của [{NCC_name}].
           Dịch vụ: [{service_description_truncated}].
           Quy tắc bắt buộc:
           - Chỉ trả lời về dịch vụ trên
           - KHÔNG cam kết giá, giảm giá, hoặc chốt lịch hẹn
           - KHÔNG cung cấp số điện thoại cá nhân NCC
           - Câu hỏi ngoài phạm vi → "Vui lòng chờ nhà cung cấp online để được hỗ trợ"

   HISTORY: [{last_20_messages as user/assistant turns}]

   USER: [{new_message.content}]

5. Gọi Gemini 2.5 Flash API (temperature=0.3, max_tokens=500, timeout=5s)
   NestJS proxy → ẩn API key, stream về Next.js qua Vercel AI SDK
6. INSERT AI response vào messages (sender_role='ai_bot', is_ai_generated=TRUE)
7. PUBLISH conv:{id} → push về KH

NCC online → gửi tin nhắn → Server HSET online_users {provider_id}
→ AI worker check: nếu provider online → skip AI, forward to NCC normally
```

**Context window management:**

```python
def build_history(messages: list[Message]) -> list[dict]:
    # Lấy 20 tin gần nhất, tính tổng token (approx 1 token = 4 chars)
    result = []
    token_count = 0
    for msg in reversed(messages[-20:]):
        tokens = len(msg.content or "") // 4
        if token_count + tokens > 3000:
            break  # không thêm tin cũ hơn nếu vượt 3000 tokens
        result.insert(0, {
            "role": "user" if msg.sender_role == "customer" else "assistant",
            "content": msg.content
        })
        token_count += tokens
    return result
```

**Fallback:**

```
LLM timeout > 5s:
  → Retry 1 lần sau 2s
  → Vẫn fail → INSERT system message: "Nhà cung cấp vắng mặt, vui lòng để lại lời nhắn"

Circuit breaker (Redis counter):
  INCR ai_failures (EX 60)
  Nếu > 3 trong 60s → SET ai_circuit_open 1 EX 300 (tắt AI 5 phút)
  → Khi ai_circuit_open EXISTS → dùng system message ngay, không gọi LLM
```

**Business Rules:**
- BR1: Chatbot chỉ kích hoạt khi NCC offline (check Redis)
- BR2: Guardrail enforced bằng system prompt trong mọi request
- BR3: Tin AI hiển thị nhãn "AI phản hồi", màu nền khác biệt
- BR4: Toàn bộ hội thoại (kể cả AI) là bằng chứng pháp lý tại UC09.2
- BR5: NCC gửi tin → HSET online_users → AI worker không trả lời nữa
- BR6: AI inference xử lý async qua BullMQ — không block WS server

## UC19 – THÔNG BÁO THEO SỰ KIỆN HỆ THỐNG {#uc19}

**Actor:** Tất cả người dùng | **Priority:** Cao

**Mô tả:** Hệ thống tự động phân loại và gửi thông báo real-time qua kênh in-app (WebSocket). Hỗ trợ thêm qua email nếu người dùng bật tùy chọn.

**Khi người dùng offline:** Lưu thông báo vào DB → khi đăng nhập lại → đẩy toàn bộ thông báo chưa đọc.

**Giao diện:** Chấm đỏ (badge) đếm số lượng trên biểu tượng chuông.

---

### Danh sách sự kiện thông báo

**Khách hàng nhận khi:**

| Sự kiện | Mô tả |
|---|---|
| BR1 | NCC gửi báo giá chi tiết |
| BR2 | Trạng thái booking thay đổi |
| BR3 | NCC báo hoàn thành (nhắc nghiệm thu trong 24h) |
| BR4 | Còn 6h hết hạn nghiệm thu chưa có phản hồi |
| BR5 | Admin gửi kết quả xử lý khiếu nại |
| BR6 | Kết quả phân xử tranh chấp được công bố |

**Nhà cung cấp nhận khi:**

| Sự kiện | Mô tả |
|---|---|
| BR7 | Có yêu cầu đặt lịch mới chờ xác nhận |
| BR8 | KH xác nhận hoặc từ chối báo giá |
| BR9 | KH hủy lịch |
| BR10 | KH nghiệm thu hoàn thành (kích hoạt trừ hoa hồng) |
| BR11 | Số dư ví chuyển sang mức âm |
| BR12 | Kết quả xét duyệt KYC |
| BR13 | Dịch vụ được duyệt hoặc bị từ chối |
| BR14 | Có tin nhắn mới từ KH trong lúc đang offline |

**Quản trị viên / Nhân viên nhận khi:**

| Sự kiện | Mô tả |
|---|---|
| BR15 | Có hồ sơ KYC mới cần xét duyệt |
| BR16 | Có dịch vụ mới cần phê duyệt |
| BR17 | Có báo cáo vi phạm mới từ hệ thống |
| BR18 | Có khiếu nại mới cần xử lý |
| BR19 | Giao dịch chuyển sang tranh chấp cần phân xử khẩn cấp |
| BR20 | AI service lỗi vượt ngưỡng (circuit breaker mở) — cần kiểm tra |

**Tất cả người dùng nhận khi:**

| Sự kiện | Mô tả |
|---|---|
| BR21 | Nhắc lịch thi công trước 24h so với thời gian đã chốt |

---

