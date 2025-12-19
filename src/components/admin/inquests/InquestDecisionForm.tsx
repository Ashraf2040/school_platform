// components/admin/inquests/InquestDecisionForm.tsx
type DecisionFormState = {
  principalOpinion: string;
  decisionText: string;
  drawAttentionText: string;
};

type Props = {
  decisionForm: DecisionFormState;
  setDecisionForm: (form: DecisionFormState) => void;
  pending: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
};

const OPTIONS = [
  { en: "Excuse accepted", ar: "عذر مقبول" },
  { en: "Alert", ar: "تنبيه" },
  { en: "Draw attention", ar: "لفت نظر" },
  { en: "Deduction for NOT accepting this excuse", ar: "حسم لعدم قبول العذر" },
];

export function InquestDecisionForm({
  decisionForm,
  setDecisionForm,
  pending,
  onSubmit,
  onCancel,
}: Props) {
  const hasDrawAttention = decisionForm.principalOpinion?.includes("Draw attention");

  const toggleOption = (englishText: string) => {
    const current = decisionForm.principalOpinion || "";
    if (current.includes(englishText)) {
      // Remove
      setDecisionForm({
        ...decisionForm,
        principalOpinion: current.replace(new RegExp(`\\|? ?${englishText.replace(/([.*+?^${}()|[\]\\])/g, '\\$1')}`, "g"), "").trim().replace(/^\| /, ""),
      });
    } else {
      // Add
      setDecisionForm({
        ...decisionForm,
        principalOpinion: current ? `${current} | ${englishText}` : englishText,
      });
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-slate-900">Add Final Decision</h2>
        <button
          type="button"
          onClick={onCancel}
          className="text-sm text-slate-600 hover:text-slate-900"
        >
          Cancel
        </button>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        {/* Principal Opinion Checkboxes */}
        <div className="p-6 bg-amber-50 border-2 border-amber-300 rounded-xl">
          <label className="block text-base font-bold text-amber-900 mb-4">
            Principal's Opinion / رأي قائد المدرسة
          </label>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            {/* English */}
            <div className="space-y-4">
              {OPTIONS.map((opt) => (
                <label key={opt.en} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={decisionForm.principalOpinion?.includes(opt.en) || false}
                    onChange={() => toggleOption(opt.en)}
                    className="w-5 h-5 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                  />
                  <span>{opt.en}</span>
                </label>
              ))}
            </div>

            {/* Arabic */}
            <div className="space-y-4 text-right" dir="rtl">
              {OPTIONS.map((opt) => (
                <label key={opt.ar} className="flex items-center gap-3 cursor-pointer justify-end">
                  <span>{opt.ar}</span>
                  <input
                    type="checkbox"
                    checked={decisionForm.principalOpinion?.includes(opt.en) || false}
                    onChange={() => toggleOption(opt.en)}
                    className="w-5 h-5 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                  />
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Conditional Draw Attention Text */}
        {hasDrawAttention && (
          <div className="p-6 bg-red-50 border-2 border-red-300 rounded-xl">
            <label className="block text-base font-bold text-red-900 mb-3">
              نص لفت النظر (سيتم إرساله للمعلم)
            </label>
            <p className="text-sm text-red-800 mb-4">
              اكتب النص الرسمي للفت النظر كما في النموذج المرفق
            </p>
            <textarea
              value={decisionForm.drawAttentionText}
              onChange={(e) =>
                setDecisionForm({ ...decisionForm, drawAttentionText: e.target.value })
              }
              required={hasDrawAttention}
              rows={10}
              placeholder="نص لفت النظر"
              className="w-full rounded-lg border border-red-400 px-4 py-3 text-sm focus:border-red-600 focus:ring-2 focus:ring-red-100 dir-auto font-['Noto_Sans_Arabic']"
            />
          </div>
        )}

        {/* Final Decision */}
        <div className="p-6 bg-teal-50 border-2 border-teal-300 rounded-xl">
          <label className="block text-base font-bold text-teal-900 mb-3">
            القرار النهائي / Final Decision
          </label>
          <textarea
            value={decisionForm.decisionText}
            onChange={(e) =>
              setDecisionForm({ ...decisionForm, decisionText: e.target.value })
            }
            rows={4}
            placeholder="القرار النهائي / Final Decision"
            className="w-full rounded-lg border border-teal-400 px-4 py-3 text-sm focus:border-teal-600 focus:ring-2 focus:ring-teal-100 dir-auto"
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={pending || (!decisionForm.principalOpinion && !decisionForm.decisionText)}
            className="rounded-lg bg-teal-600 px-8 py-3 text-base font-medium text-white shadow hover:bg-teal-700 disabled:opacity-60 transition"
          >
            {pending ? "Saving..." : "Save Decision & Complete Inquest"}
          </button>
        </div>
      </form>
    </div>
  );
}