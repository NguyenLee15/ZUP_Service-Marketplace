# HomeService JMeter Test Plan

File chinh: `homeservice-load-test.jmx`

Mo trong JMeter:

1. `File` -> `Open`
2. Chon `docs/jmeter/homeservice-load-test.jmx`
3. Doi bien trong `User Defined Variables`:
   - `baseProtocol`: `http` khi test local, `https` khi test deploy
   - `baseHost`: `localhost` hoac domain Vercel
   - `basePort`: `3000` khi test local, de trong khi test HTTPS deploy
   - `keyword`: tu khoa tim kiem dich vu

Mac dinh test web deploy tren Vercel: `https://service-marketplace-gold.vercel.app`.

Neu muon test local, doi lai:

- `baseProtocol`: `http`
- `baseHost`: `localhost`
- `basePort`: `3000`

Thread group `TG01 Anonymous Browse` da bat san:

- `GET /`
- `GET /services`
- `GET /api/services/search`

Mac dinh `TG01 Anonymous Browse` chay 100 users, ramp-up 120 giay, 5 loops.
Co the override bang `-Jusers`, `-Jrampup`, `-Jloops` khi chay CLI.

Thread group `TG02 Authenticated Customer Flow` dang tat mac dinh. Luong nay bo sung
test nghiep vu co dang nhap:

- `POST /api/auth/login`
- `GET /api/auth/profile`
- `GET /api/bookings`
- `GET /api/notifications/unread-count`

De test authenticated flow:

1. Sua `users.sample.csv` thanh tai khoan test that.
2. Nen disable `TG01 Anonymous Browse` de bao cao rieng luong authenticated.
3. Enable `TG02 Authenticated Customer Flow`.
4. Chay smoke voi 1-2 users truoc, sau do moi tang len 10-20 users.
5. Neu login loi, kiem tra JSON Extractor `accessToken`: `$.data.accessToken`.

Mac dinh `TG02` chay 20 users, ramp-up 60 giay, 3 loops. Co the override:

```powershell
.\jmeter.bat -n `
  -t "D:\Do an tot nghiep\service-marketplace\docs\jmeter\homeservice-load-test.jmx" `
  -JbaseProtocol=https `
  -JbaseHost=service-marketplace-gold.vercel.app `
  -JbasePort= `
  -JauthUsers=20 `
  -JauthRampup=60 `
  -JauthLoops=3 `
  -JusersCsv="D:\Do an tot nghiep\service-marketplace\docs\jmeter\users.sample.csv" `
  -l "D:\Do an tot nghiep\service-marketplace\reports\jmeter\run_auth_20users.jtl" `
  -e `
  -o "D:\Do an tot nghiep\service-marketplace\reports\jmeter\run_auth_20users"
```

Chay GUI de kiem tra nhanh 1-2 users. Chay load test that bang command line:

```powershell
cd C:\apache-jmeter-5.x\bin

.\jmeter.bat -n `
  -t "D:\Do an tot nghiep\service-marketplace\docs\jmeter\homeservice-load-test.jmx" `
  -l "D:\Do an tot nghiep\service-marketplace\reports\jmeter\run_10users.jtl" `
  -e `
  -o "D:\Do an tot nghiep\service-marketplace\reports\jmeter\run_10users"
```

Override domain, so user, ramp-up, loop khi chay CLI:

```powershell
.\jmeter.bat -n `
  -t "D:\Do an tot nghiep\service-marketplace\docs\jmeter\homeservice-load-test.jmx" `
  -JbaseProtocol=https `
  -JbaseHost=service-marketplace-gold.vercel.app `
  -JbasePort= `
  -Jusers=100 `
  -Jrampup=120 `
  -Jloops=5 `
  -l "D:\Do an tot nghiep\service-marketplace\reports\jmeter\run_100users.jtl" `
  -e `
  -o "D:\Do an tot nghiep\service-marketplace\reports\jmeter\run_100users"
```

Chi so dung de bao cao:

- Average: average response time
- Median, 90%, 95%, 99% line: percentile response time
- Min/Max: min va peak response time
- Throughput: requests per second
- Error %: error rate
- Transaction Controller: transactions passed / failed
