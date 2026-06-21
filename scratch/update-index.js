const fs = require('fs');
let content = fs.readFileSync('fe/mobile/app/(tabs)/index.tsx', 'utf-8');

// 1. Rename stats to todayStats except where it's already todayStats
// Wait, I will just apply my manual modifications block by block to be 100% accurate.
content = content.replace(
  'const [stats, setStats] = useState<Stats | null>(null);',
  'const [todayStats, setTodayStats] = useState<Stats | null>(null);\n  const [yesterdayStats, setYesterdayStats] = useState<Stats | null>(null);'
);

content = content.replace(
  /const reportParams[\s\S]*?const reportSummary = ".*?";/,
  ''
);

content = content.replace(
  /try \{\n\s*const \[statsRes, bookingsRes\] = await Promise\.all\(\[\n\s*dashboardApi\.getStats\(reportParams\)\.catch\(\(\) => null\),\n\s*bookingApi/,
  \const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);

    try {
      const [todayRes, yesterdayRes, bookingsRes] = await Promise.all([
        dashboardApi.getStats({ from: todayStr, to: todayStr, groupBy: 'day', reportType: 'overview' }).catch(() => null),
        dashboardApi.getStats({ from: yesterdayStr, to: yesterdayStr, groupBy: 'day', reportType: 'overview' }).catch(() => null),
        bookingApi\
);

content = content.replace('if (statsRes?.data?.data) setStats(statsRes.data.data);', 'if (todayRes?.data?.data) setTodayStats(todayRes.data.data);\n      if (yesterdayRes?.data?.data) setYesterdayStats(yesterdayRes.data.data);');

content = content.replace(
  /\}, \[\n\s*reportParams\.from,\n\s*reportParams\.to,\n\s*reportParams\.groupBy,\n\s*reportParams\.reportType,\n\s*\]\);/,
  '}, []);'
);

content = content.replace(
  /const query = new URLSearchParams\([\s\S]*?const extension = type === "pdf" \? "pdf" : "xlsx";/m,
  \const todayStr = new Date().toISOString().slice(0, 10);
        const query = new URLSearchParams({
          from: todayStr,
          to: todayStr,
          groupBy: "day",
          reportType: "overview",
        }).toString();
        const extension = type === "pdf" ? "pdf" : "xlsx";\
);

content = content.replace(
  /const range = .*;\n\s*const fileUri = .*;/m,
  'const fileUri = \\provider-overview-\-\.\\;'
);

content = content.replace(/dialogTitle: \Báo cáo \$\{selectedReportLabel\}\/g, 'dialogTitle: "Báo cáo t?ng quan"');
content = content.replace(/text: \Ðã t?o báo cáo \$\{selectedReportLabel\} \(\$\{type\.toUpperCase\(\)\}\)\.\/g, 'text: \Ðã t?o báo cáo t?ng quan (\).\');
content = content.replace(
  /stats,\n\s*reportLabel: selectedReportLabel,\n\s*reportSummary,\n/g,
  'stats: todayStats,\n            reportLabel: "T?ng quan",\n            reportSummary: "Báo cáo hôm nay",\n'
);

// UI updates
content = content.replace(
  /<Text variant="titleMedium" style=\{styles\.cardTitle\}>Hi?u su?t tháng này<\/Text>\n\s*<Text variant="bodySmall" style=\{styles\.cardDescription\}>T?ng quan các ch? s? quan tr?ng\.<\/Text>/,
  '<Text variant="titleMedium" style={styles.cardTitle}>Hi?u su?t hôm nay</Text>\\n          <Text variant="bodySmall" style={styles.cardDescription}>So sánh v?i ngày hôm qua.</Text>'
);

content = content.replace(
  /label="T?ng don"\n\s*value=\{String\(stats\?\.totalBookings \?\? "—"\)\}/,
  \label="T?ng don"
          value={String(todayStats?.totalBookings ?? "—")}
          trend={todayStats && yesterdayStats ? todayStats.totalBookings - yesterdayStats.totalBookings : undefined}\
);

content = content.replace(
  /label="Doanh thu"\n\s*value=\{stats \? formatCurrency\(stats\.totalRevenue\) : "—"\}/,
  \label="Doanh thu"
          value={todayStats ? formatCurrency(todayStats.totalRevenue) : "—"}
          trend={todayStats && yesterdayStats ? todayStats.totalRevenue - yesterdayStats.totalRevenue : undefined}\
);

content = content.replace(
  /label="Ðánh giá"\n\s*value=\{\n\s*stats\?\.avgRating\n\s*\? \\$\{Number\(stats\.avgRating\)\.toFixed\(1\)\}\/5\\n\s*: "—"\n\s*\}/,
  \label="Ðánh giá"
          value={
            todayStats?.avgRating
              ? \\\\/5\\\
              : "—"
          }\
);

content = content.replace(
  /label="T? l? h?y"\n\s*value=\{\n\s*stats\?\.cancelRate != null\n\s*\? \\$\{Number\(stats\.cancelRate\)\.toFixed\(1\)\}%\n\s*: "—"\n\s*\}/,
  \label="T? l? h?y"
          value={
            todayStats?.cancelRate != null
              ? \\\\%\\\
              : "—"
          }
          trend={todayStats && yesterdayStats ? Number(todayStats.cancelRate) - Number(yesterdayStats.cancelRate) : undefined}
          trendSuffix="%"\
);

// Replace status chips with simple text overview
content = content.replace(
  /\{\["overview", "status"\].includes\(reportParams\.reportType\) && \([\s\S]*?<\/ProviderCard>\n\s*<\/>\n\s*\)\}/,
  \      <ProviderSectionHeader title="T?ng quan tr?ng thái" />
      <ProviderCard>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 16 }}>
          <View style={{ flex: 1, minWidth: "45%" }}>
            <Text variant="labelSmall" style={{ color: activeColors.textSecondary }}>Ch? xác nh?n</Text>
            <Text variant="titleLarge" style={{ color: activeColors.statusPending, fontWeight: "700" }}>{todayStats?.pendingCount || 0}</Text>
          </View>
          <View style={{ flex: 1, minWidth: "45%" }}>
            <Text variant="labelSmall" style={{ color: activeColors.textSecondary }}>Ðang th?c hi?n</Text>
            <Text variant="titleLarge" style={{ color: activeColors.statusInProgress, fontWeight: "700" }}>{todayStats?.inProgressCount || 0}</Text>
          </View>
          <View style={{ flex: 1, minWidth: "45%" }}>
            <Text variant="labelSmall" style={{ color: activeColors.textSecondary }}>Ðã hoàn thành</Text>
            <Text variant="titleLarge" style={{ color: activeColors.statusDone, fontWeight: "700" }}>{todayStats?.doneCount || 0}</Text>
          </View>
        </View>
      </ProviderCard>\
);

// Update chart variables
content = content.replace(/stats\?\.revenueData/g, 'todayStats?.revenueData');
content = content.replace(/stats\.revenueData/g, 'todayStats.revenueData');
content = content.replace(/stats\?\.totalRevenue/g, 'todayStats?.totalRevenue');

content = content.replace(
  /data: revenueSeries\n\s*\.slice\(-6\)\n\s*\.map\(\(value\) => Math\.max\(value, 0\)\),/,
  'data: revenueSeries.length ? revenueSeries.slice(-6).map((value: number) => Math.max(value, 0)) : [0],'
);

content = content.replace(/\["Tu?n 1", "Tu?n 2", "Tu?n 3", "Tu?n 4"\]/, '["T1", "T2", "T3", "T4"]');

fs.writeFileSync('fe/mobile/app/(tabs)/index.tsx', content);
