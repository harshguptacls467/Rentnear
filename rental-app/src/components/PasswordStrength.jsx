import { Check, X } from 'lucide-react';

const PasswordStrength = ({ password = '' }) => {
  const rules = [
    { label: 'At least 6 characters', test: (p) => p.length >= 6 },
    { label: 'At least one number', test: (p) => /\d/.test(p) },
    { label: 'At least one capital letter', test: (p) => /[A-Z]/.test(p) },
    { label: 'At least one special character', test: (p) => /[^A-Za-z0-9]/.test(p) },
  ];

  const score = rules.reduce((acc, rule) => acc + (rule.test(password) ? 1 : 0), 0);

  const getStrengthLabel = () => {
    if (!password) return { text: 'Empty', color: 'bg-gray-200', textClass: 'text-gray-400', width: 'w-0' };
    if (score <= 1) return { text: 'Weak ⚠️', color: 'bg-red-500', textClass: 'text-red-500', width: 'w-1/4' };
    if (score === 2) return { text: 'Medium ⚡', color: 'bg-amber-500', textClass: 'text-amber-500', width: 'w-1/2' };
    if (score === 3) return { text: 'Good ✨', color: 'bg-blue-500', textClass: 'text-blue-500', width: 'w-3/4' };
    return { text: 'Strong 💪', color: 'bg-emerald-500', textClass: 'text-emerald-500', width: 'w-full' };
  };

  const strength = getStrengthLabel();

  return (
    <div className="mt-2 space-y-3 bg-gray-50/50 backdrop-blur-sm p-3.5 border border-gray-100 rounded-xl transition-all duration-300">
      <div className="flex justify-between items-center text-xs">
        <span className="text-gray-500 font-medium">Password Strength:</span>
        <span className={`font-bold transition-all duration-200 ${strength.textClass}`}>
          {strength.text}
        </span>
      </div>

      {/* Progress Bar Container */}
      <div className="h-1.5 w-full bg-gray-200/80 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${strength.color} ${strength.width}`}
        />
      </div>

      {/* Criteria Checklist */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1 text-[11px]">
        {rules.map((rule, idx) => {
          const isPassed = rule.test(password);
          return (
            <div
              key={idx}
              className={`flex items-center gap-1.5 font-medium transition-colors ${
                isPassed ? 'text-emerald-600' : 'text-gray-400'
              }`}
            >
              {isPassed ? (
                <div className="w-3.5 h-3.5 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                  <Check size={10} strokeWidth={3} />
                </div>
              ) : (
                <div className="w-3.5 h-3.5 rounded-full bg-gray-200/60 flex items-center justify-center text-gray-400">
                  <X size={10} strokeWidth={3} />
                </div>
              )}
              <span>{rule.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PasswordStrength;
