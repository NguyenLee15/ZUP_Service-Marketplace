<!-- FILE: 06_UC_AI_SEARCH.md | SCOPE: UC15 AI Recommendation System (Pipeline · Feature Engineering · Ranking) -->

## UC15 – TÌM KIẾM VÀ KHÁM PHÁ DỊCH VỤ {#uc15}

### UC15.1 – Tìm kiếm và lọc dịch vụ

**Actor:** Khách hàng (không bắt buộc đăng nhập) | **Priority:** Cao

**Tìm kiếm:** Không phân biệt hoa/thường, hỗ trợ không dấu, khớp chuỗi con. Lịch sử 5 từ khóa gần đây lưu `localStorage` phía client (không gọi API DB).

**Bộ lọc:** Danh mục (cây cha–con), khu vực GPS (bán kính 5–15km), khu vực nhập tay, khoảng giá, số sao ≥ N.

**Sắp xếp:** Liên quan nhất (mặc định) / Gần nhất / Giá tăng dần / Đánh giá cao nhất / Mới nhất.

**Business Rules:** BR1: Chỉ hiển thị dịch vụ `status = 'active'`. BR2: Server-side pagination bắt buộc.

---

### UC15.2 – Xem chi tiết dịch vụ và hồ sơ nhà cung cấp

**Actor:** Khách hàng | **Priority:** Cao

**Nội dung:** Slider ảnh/video, tên/danh mục/giá tham khảo/mô tả, khu vực, điểm đánh giá, load-more đánh giá, profile card NCC, CTA "Đặt lịch ngay" ghim dưới màn hình.

**Business Rules:** BR1: Không hiển thị email/CCCD/địa chỉ nhà NCC. BR2: Đánh giá chỉ từ booking `DONE`.

---

### UC15.3 – AI Recommendation System

**Actor:** Khách hàng | **Priority:** Trung bình

> **Đây là Recommendation System, không phải chỉ là "gọi AI API".** Bao gồm Data Pipeline, Feature Engineering, Ranking Logic, và Personalization.

---

#### A. Data Pipeline (Offline — chạy liên tục nền)

```
┌─────────────────────────────────────────────────────────────────┐
│                    DATA SOURCES                                  │
│                                                                  │
│  1. Service Data   2. Booking Events   3. User Behavior         │
│  (DB: services)    (DB: bookings)      (DB: user_events)        │
│       │                  │                    │                  │
│       └──────────────────┼────────────────────┘                 │
│                          │                                       │
│                   ┌──────▼──────┐                               │
│                   │ ETL Worker   │  (chạy async, BullMQ)        │
│                   └──────┬──────┘                               │
│                          │                                       │
│          ┌───────────────┼────────────────────┐                 │
│          ▼               ▼                    ▼                  │
│   Embedding Store   Feature Store        Behavior Store         │
│   (pgvector)        (Redis Cache)        (DB: user_profiles)    │
└─────────────────────────────────────────────────────────────────┘
```

**Data Source 1 — Service Data (cập nhật khi NCC thay đổi dịch vụ):**

```
Trigger: POST/PATCH /services → INSERT embedding_job vào queue

Worker xử lý:
  text = "{service.name}. Danh mục: {category.name}.
           Khu vực: {area}. {service.description[:600]}"
  → Gọi Embedding API (text-embedding-004 (Google Gemini))
  → UPDATE services SET
      embedding = :vector,
      embedding_version = 'gemini-te004-v1',
      embedding_updated_at = NOW()

Cron fallback (mỗi 7 ngày):
  Re-embed các service có embedding_updated_at > 7 ngày
  (đảm bảo embedding không stale khi model update)
```

**Data Source 2 — Booking Events (cập nhật real-time):**

```sql
-- Feature: provider_stats (tính lại sau mỗi booking status change)
UPDATE provider_stats SET
    total_bookings     = (SELECT COUNT(*) FROM bookings WHERE provider_id = ?),
    completed_bookings = (SELECT COUNT(*) FROM bookings WHERE provider_id = ? AND status = 'DONE'),
    cancelled_bookings = (SELECT COUNT(*) FROM bookings WHERE provider_id = ? AND status = 'CANCELLED'),
    avg_rating         = (SELECT AVG(stars) FROM reviews r JOIN bookings b ON r.booking_id = b.id
                          WHERE b.provider_id = ?),
    completion_rate    = completed_bookings::float / NULLIF(total_bookings, 0),
    updated_at         = NOW()
WHERE provider_id = ?;
```

**Data Source 3 — User Behavior (logging mọi hành động tìm kiếm):**

```sql
-- Bảng ghi hành vi người dùng (dùng cho personalization)
CREATE TABLE user_events (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES users(id),  -- NULL nếu chưa đăng nhập
    session_id      UUID NOT NULL,
    event_type      VARCHAR(30) NOT NULL,
    -- 'search'        : KH nhập query tìm kiếm
    -- 'view_service'  : KH mở trang chi tiết dịch vụ
    -- 'click_result'  : KH click vào kết quả AI gợi ý (vị trí bao nhiêu)
    -- 'book_service'  : KH tạo booking
    -- 'ai_query'      : KH dùng AI gợi ý
    payload         JSONB NOT NULL,
    -- search:       {query, filters, result_count}
    -- view_service: {service_id, source: 'search'|'ai'|'direct'}
    -- click_result: {service_id, position, query}
    -- book_service: {service_id, booking_id}
    -- ai_query:     {query, extracted_intent, result_ids}
    created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_events_user ON user_events(user_id, event_type, created_at DESC);
CREATE INDEX idx_events_session ON user_events(session_id, created_at DESC);

-- User preference profile (tổng hợp từ behavior)
CREATE TABLE user_profiles (
    user_id             UUID PRIMARY KEY REFERENCES users(id),
    preferred_categories JSONB,   -- [{category_id, score}] sắp xếp theo mức độ quan tâm
    preferred_area       JSONB,   -- {lat, lng, radius_km} từ lịch sử booking
    price_sensitivity    VARCHAR(10),  -- 'low' | 'medium' | 'high' (từ filter history)
    booking_count        INT DEFAULT 0,
    last_active_at       TIMESTAMPTZ,
    updated_at           TIMESTAMPTZ DEFAULT NOW()
);
```

**Cập nhật user_profile:** Job chạy mỗi giờ, aggregate `user_events` của 90 ngày gần nhất → cập nhật `user_profiles`. Không cần ML model — dùng rule-based aggregation đủ cho scope đồ án.

---

#### B. Feature Engineering — 7 Signals

| Signal | Nguồn dữ liệu | Công thức / Logic | Range |
|---|---|---|---|
| `semantic_score` | pgvector cosine | `1 - (embedding <=> query_vector)` | 0.0–1.0 |
| `rating_score` | `provider_stats.avg_rating` | `avg_rating / 5.0` (0 nếu chưa có) | 0.0–1.0 |
| `completion_rate` | `provider_stats.completion_rate` | Thực tế | 0.0–1.0 |
| `proximity_score` | GPS KH + `service.area_centroid` | `max(0, 1 - dist_km / 15)` | 0.0–1.0 |
| `recency_score` | `services.created_at` | `1 / (1 + days_since_created / 30)` | 0.0–1.0 |
| `urgency_boost` | Intent extraction (LLM) | 1.3 nếu urgent, 1.0 nếu không | multiplier |
| `personalization_score` | `user_profiles.preferred_categories` | Score từ preferred category map | 0.0–1.0 |

**Cold Start — NCC mới chưa có booking/rating:**
- `rating_score = 0` → compensate bằng `recency_score` cao (mới tham gia = bonus)
- `completion_rate = 0` → dùng `profile_completeness` thay thế
  ```
  profile_completeness = (
    has_avatar * 0.2 +
    description_length > 200 * 0.3 +
    has_area_defined * 0.2 +
    kyc_approved * 0.3
  )
  ```
- Kết quả: NCC mới vẫn xuất hiện, không bị đẩy xuống cuối

---

#### C. Online Pipeline (khi KH gửi query)

```
Input: "ống nước nhà tôi bị rò rỉ cần sửa gấp"
       + user_id (nếu đăng nhập)
       + GPS coordinates

Step 1 — Intent Extraction (**Gemini 2.5 Flash** via NestJS proxy, ~300ms):
  Prompt system: "Extract JSON only. No explanation.
                  Fields: service_type (string), urgency (low|medium|high),
                  area_hint (string|null), budget_hint (string|null)"
  Output: {
    "service_type": "sửa ống nước",
    "urgency": "high",
    "area_hint": null,
    "budget_hint": null
  }

Step 2 — Query Embedding (~200ms):
  embed("{service_type}: ống nước rò rỉ sửa gấp")
  → vector Q [768 dims]

Step 3 — Candidate Retrieval (~50ms):
  SELECT s.id, s.provider_id,
         1 - (s.embedding <=> :Q) AS semantic_score,
         ps.avg_rating, ps.completion_rate,
         ST_Distance(s.area_centroid, :user_point) AS dist_meters
  FROM services s
  JOIN provider_stats ps ON ps.provider_id = s.provider_id
  LEFT JOIN provider_wallets pw ON pw.user_id = s.provider_id
  WHERE s.status = 'active'
    AND (pw.is_restricted IS NULL OR pw.is_restricted = FALSE)
    AND ST_DWithin(s.area_centroid, :user_point, 15000)  -- 15km radius
  ORDER BY s.embedding <=> :Q   -- ANN search
  LIMIT 50;

Step 4 — Re-ranking (~5ms, in-memory):
  W = {semantic: 0.30, rating: 0.25, completion: 0.20,
       proximity: 0.15, recency: 0.05, personalization: 0.05}

  for each candidate in top_50:
    base_score = (
      W.semantic     * candidate.semantic_score       +
      W.rating       * (candidate.avg_rating / 5.0)  +
      W.completion   * candidate.completion_rate      +
      W.proximity    * max(0, 1 - dist_km / 15)      +
      W.recency      * recency_score(candidate)       +
      W.personal     * personalization_score(user, candidate)
    )
    final_score = base_score * urgency_multiplier(intent.urgency)

  Sort by final_score DESC, take top 10

Step 5 — Log event (~async, không block response):
  INSERT user_events (event_type='ai_query',
    payload={query, extracted_intent, result_ids: top_10_ids})

Step 6 — Explanation Generation (optional, LLM, ~300ms):
  Nếu còn trong budget time (< 4.5s tổng):
    Prompt: "Giải thích ngắn gọn tại sao {service_name} phù hợp với '{query}'"
    → "Phù hợp: sửa ống nước, cách bạn ~2km, đánh giá 4.8★"
  Nếu timeout budget: bỏ qua explanation, trả kết quả không có lý do

Total target: ≤ 5 giây (Step 1+2+3+4+5+6 song song hóa khi có thể)
```

---

#### D. Personalization Logic

```python
def personalization_score(user_id, service):
    if user_id is None:
        return 0.0  # chưa đăng nhập, không personalize

    profile = get_user_profile(user_id)
    if profile is None or profile.booking_count < 2:
        return 0.0  # chưa đủ data để personalize

    # Score dựa trên lịch sử category ưa thích
    category_score = profile.preferred_categories.get(
        service.category_id, 0.0
    )

    # Score dựa trên khu vực ưa thích (gần địa chỉ hay đặt nhất)
    area_score = 0.0
    if profile.preferred_area:
        dist = haversine(profile.preferred_area, service.area_centroid)
        area_score = max(0, 1 - dist / 10)  # decay 10km

    return 0.6 * category_score + 0.4 * area_score
```

---

#### E. Fallback Strategy (3 tầng)

```
Tầng 1 (AI đầy đủ): LLM intent + Vector search + Re-ranking
  → Khi AI healthy, response < 5s

Tầng 2 (Vector only): Bỏ LLM, dùng raw query cho embedding
  → Khi LLM timeout (> 3s), không có urgency_boost, không có explanation
  → Toast: "Đang hiển thị kết quả gần nhất với yêu cầu của bạn"

Tầng 3 (Full-text SQL): Bỏ cả vector, dùng PostgreSQL `LIKE '%query%'` (fallback cam kết trong ARCHITECTURE.md)
  → Khi pgvector lỗi hoặc embedding service down
  → Toast: "Hệ thống AI đang bảo trì, hiển thị kết quả tìm kiếm tiêu chuẩn"

Circuit breaker:
  3 lỗi LLM trong 1 phút → disable LLM 5 phút (Tầng 2)
  3 lỗi vector trong 1 phút → disable vector 5 phút (Tầng 3)
```

**Business Rules:**
- BR1: Tổng timeout toàn pipeline ≤ 5 giây
- BR2: Trọng số W đọc từ config DB — Admin có thể chỉnh không cần deploy lại
- BR3: AI chỉ gợi ý `status = 'active'` và `is_restricted = FALSE`
- BR4: NCC mới vẫn xuất hiện (cold start formula)
- BR5: Log mọi ai_query vào `user_events` để cải thiện personalization
- BR6: Explanation là optional — không được block kết quả vì thiếu explanation

**Ghi chú triển khai:**
- `pgvector`: extension PostgreSQL, không cần infrastructure riêng
- Index: `CREATE INDEX ON services USING ivfflat (embedding vector_cosine_ops) WITH (lists=100)` — hiệu quả khi > 1.000 dịch vụ
- Embedding model: `text-embedding-004 (Google Gemini)` — 768 chiều, hỗ trợ tốt tiếng Việt. Phương án dự phòng: `bge-m3` (open-source, self-hosted)
- Không có training loop: hệ thống dùng pre-trained embedding + rule-based ranking — đủ cho marketplace scope. Training loop (collaborative filtering, RLHF) là roadmap sau khi đủ dữ liệu (> 10.000 completed bookings)

