const fs = require('fs');
let content = fs.readFileSync('fe/mobile/app/profile/analytics.tsx', 'utf-8');

const importsToAdd = \
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import * as Print from "expo-print";
import { API_BASE_URL } from "../../features/auth/auth.api";
import { getFreshAccessToken } from "../../features/auth/auth.store";
import { createProviderReportPdfFallback } from "../../utils/pdf-generator";
\;

content = content.replace(
  "import { Colors } from '../../constants/colors';",
  "import { Colors } from '../../constants/colors';\n" + importsToAdd
);

content = content.replace(
  "const [error, setError] = useState('');",
  "const [error, setError] = useState('');\n  const [exporting, setExporting] = useState<'pdf' | 'excel' | null>(null);\n  const [message, setMessage] = useState<{ tone: 'success' | 'error' | 'info', text: string } | null>(null);"
);

const handleExportFunc = \
  const handleExport = async (type: "pdf" | "excel") => {
    setExporting(type);
    setMessage(null);
    try {
      const token = await getFreshAccessToken();
      if (!token) throw new Error("Phiên dang nh?p dã h?t h?n.");

      const query = new URLSearchParams(
        Object.entries(params).reduce(
          (acc, [key, value]) => {
            if (value) acc[key] = value;
            return acc;
          },
          {} as Record<string, string>
        )
      ).toString();
      const extension = type === "pdf" ? "pdf" : "xlsx";
      const range = \\\\-\\\\;
      const fileUri = \\\\provider-analytics-\-\.\\\\;
      const downloadUrl = \\\\/provider/dashboard/export-\?\\\\;
      const result = await FileSystem.downloadAsync(downloadUrl, fileUri, {
        headers: { Authorization: \\\Bearer \\\\ },
      });

      if (result.status && result.status >= 400) {
        throw new Error(\\\Xu?t báo cáo th?t b?i (\).\\\);
      }

      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(result.uri, {
          mimeType:
            type === "pdf"
              ? "application/pdf"
              : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          dialogTitle: "Báo cáo hi?u su?t",
        });
      }
      setMessage({
        tone: "success",
        text: \\\Ðã t?o báo cáo hi?u su?t (\).\\\,
      });
    } catch (error: unknown) {
      if (type === "pdf" && stats) {
        try {
          const html = createProviderReportPdfFallback({
            stats,
            reportLabel: "Hi?u su?t & Doanh thu",
            reportSummary: \\\\ · \\\\,
            formatCurrency,
          });
          const result = await Print.printToFileAsync({
            html,
            base64: false,
          });
          const isAvailable = await Sharing.isAvailableAsync();
          if (isAvailable) {
            await Sharing.shareAsync(result.uri, {
              mimeType: "application/pdf",
              dialogTitle: "Báo cáo hi?u su?t",
            });
          }
          setMessage({
            tone: "success",
            text: \\\Ðã t?o báo cáo ngo?i tuy?n (PDF).\\\,
          });
          return;
        } catch (pdfError) {
          console.error("PDF Fallback error:", pdfError);
        }
      }

      const friendlyMessage =
        error instanceof Error
          ? error.message.includes("Network")
            ? "Không th? k?t n?i d?n máy ch?. Vui lòng ki?m tra m?ng."
            : error.message
          : "Ðã x?y ra l?i không xác d?nh.";

      setMessage({
        tone: "error",
        text: friendlyMessage,
      });
    } finally {
      setExporting(null);
    }
  };
\;

content = content.replace(
  "const load = useCallback(async () => {",
  handleExportFunc + "\n  const load = useCallback(async () => {"
);

// Add message above filter card
content = content.replace(
  "{error ? <ProviderInlineMessage tone=\\"error\\" message={error} /> : null}",
  "{error ? <ProviderInlineMessage tone=\\"error\\" message={error} /> : null}\n      {message ? <ProviderInlineMessage tone={message.tone as any} message={message.text} /> : null}"
);

// Replace AI Header with Export card
const aiCardRegex = /<ProviderCard>\\s*<View style=\{styles\\.aiHeader\}>[\\s\\S]*?<\\/ProviderCard>/;
const exportUI = \
      <View style={{ flexDirection: "row", gap: 12 }}>
        <ProviderCard style={{ flex: 1 }} contentStyle={{ alignItems: "center", gap: 8 }}>
          <IconButton
            icon="file-pdf-box"
            iconColor={activeColors.error}
            size={32}
            mode="contained-tonal"
            containerColor={\\\\16\\\}
            onPress={() => handleExport("pdf")}
            disabled={exporting !== null || loading || !stats}
          />
          <Text variant="labelMedium" style={{ fontWeight: "700" }}>
            Xu?t PDF
          </Text>
        </ProviderCard>
        <ProviderCard style={{ flex: 1 }} contentStyle={{ alignItems: "center", gap: 8 }}>
          <IconButton
            icon="file-excel"
            iconColor={activeColors.success}
            size={32}
            mode="contained-tonal"
            containerColor={\\\\16\\\}
            onPress={() => handleExport("excel")}
            disabled={exporting !== null || loading || !stats}
          />
          <Text variant="labelMedium" style={{ fontWeight: "700" }}>
            Xu?t Excel
          </Text>
        </ProviderCard>
      </View>
\;

content = content.replace(aiCardRegex, exportUI);

fs.writeFileSync('fe/mobile/app/profile/analytics.tsx', content);
