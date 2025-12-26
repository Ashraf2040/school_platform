// components/admin/inquests/InquestDetailsView.tsx
import { Inquest } from "./types";

type Props = {
  inquest: Inquest;
  onAddDecision: () => void;
  onPreview: () => void;
};

export function InquestDetailsView({ inquest, onAddDecision, onPreview }: Props) {
  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Inquest Details</h2>
          <div className="flex flex-wrap gap-2 mt-3">
            <span
              className={`px-3 py-1 rounded text-xs font-medium ${
                inquest.inquestType === "ABSENT"
                  ? "bg-orange-100 text-orange-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {inquest.inquestType === "ABSENT" ? "Absent" : "Negligence"}
            </span>
            <span
              className={`px-3 py-1 rounded text-xs font-medium ${
                inquest.status === "PENDING"
                  ? "bg-yellow-100 text-yellow-700"
                  : inquest.status === "RESPONDED"
                  ? "bg-blue-100 text-blue-700"
                  : "bg-green-100 text-green-700"
              }`}
            >
              {inquest.status}
            </span>
          </div>
        </div>

        <div className="flex gap-3 flex-wrap">
          {inquest.status === "RESPONDED" && (
            <button
              onClick={onAddDecision}
              className="rounded-lg bg-teal-600 px-5 py-2 text-sm font-medium text-white shadow hover:bg-teal-700 transition"
            >
              Add Decision
            </button>
          )}
          {inquest.status === "COMPLETED" && (
            <button
              onClick={onPreview}
              className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white shadow hover:bg-indigo-700 transition"
            >
              Preview
            </button>
          )}
        </div>
      </div>

      <div className="text-sm space-y-4">
        <div>
          <span className="font-medium text-slate-700">Issued on:</span>
          <span className="ml-2 text-slate-900">
            {new Date(inquest.createdAt).toLocaleDateString()}
          </span>
        </div>

        <div>
          <span className="font-medium text-slate-700">Reason:</span>
          <p className="mt-1 text-slate-900" dir="auto">{inquest.reason}</p>
        </div>

        {inquest.details && (
          <div>
            <span className="font-medium text-slate-700">Details:</span>
            <p className="mt-1 text-slate-900" dir="auto">{inquest.details}</p>
          </div>
        )}

        {inquest.teacherClarification && (
          <div>
            <span className="font-medium text-slate-700">Teacher Response:</span>
            <p className="mt-1 text-slate-900" dir="auto">{inquest.teacherClarification}</p>
          </div>
        )}

        {inquest.attachmentUrl && (
          <div>
            <span className="font-medium text-slate-700">Attachment:</span>
            <a
              href={inquest.attachmentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-2 text-teal-600 hover:underline"
            >
              View PDF →
            </a>
          </div>
        )}

        {inquest.principalOpinion && (
          <div>
            <span className="font-medium text-slate-700">Principal Opinion:</span>
            <p className="mt-1 text-slate-900" dir="auto">{inquest.principalOpinion}</p>
          </div>
        )}

        {inquest.decisionText && (
          <div className="bg-teal-50 rounded-lg p-4">
            <span className="font-medium text-slate-700">Final Decision:</span>
            <p className="mt-2 font-medium text-teal-800" dir="auto">{inquest.decisionText}</p>
          </div>
        )}

        <div>
          <span className="font-medium text-slate-700">Academic Year:</span>
          <span className="ml-2 text-slate-900">{inquest.academicYear.name}</span>
        </div>
      </div>
    </div>
  );
}