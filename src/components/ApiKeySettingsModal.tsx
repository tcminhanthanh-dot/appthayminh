import React, { useState, useEffect } from 'react';
import {
  X,
  KeyRound,
  ExternalLink,
  CheckCircle2,
  Cpu,
  Zap,
  Sparkles,
  ShieldCheck,
  Eye,
  EyeOff,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import {
  AI_MODELS,
  getStoredApiKey,
  saveStoredApiKey,
  getStoredModel,
  saveStoredModel,
} from '../utils/aiService';

interface ApiKeySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
  isMandatory?: boolean; // Bắt buộc nhập nếu chưa có key
}

export const ApiKeySettingsModal: React.FC<ApiKeySettingsModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  isMandatory = false,
}) => {
  const [apiKey, setApiKey] = useState('');
  const [selectedModel, setSelectedModel] = useState('gemini-3-flash-preview');
  const [showKey, setShowKey] = useState(false);
  const [isSavedSuccess, setIsSavedSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      setApiKey(getStoredApiKey());
      setSelectedModel(getStoredModel());
      setIsSavedSuccess(false);
      setErrorMessage('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    const trimmed = apiKey.trim();
    if (!trimmed) {
      setErrorMessage('Vui lòng nhập API Key của bạn để sử dụng ứng dụng.');
      return;
    }

    saveStoredApiKey(trimmed);
    saveStoredModel(selectedModel);
    setIsSavedSuccess(true);
    setErrorMessage('');

    setTimeout(() => {
      if (onSaved) onSaved();
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-blue-50/80 via-indigo-50/50 to-white dark:from-slate-900 dark:via-blue-950/20 dark:to-slate-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                Thiết Lập Model &amp; API Key
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                  Thầy Minh - vẽ hình
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Nhập Gemini API Key cá nhân để khai phóng toàn bộ sức mạnh AI DGS
              </p>
            </div>
          </div>

          {!isMandatory && (
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Instructions banner */}
          <div className="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-bold flex items-center gap-2">
                <span>Chưa có API key? Lấy miễn phí chỉ trong 30 giây:</span>
              </div>
              <p className="text-amber-800 dark:text-amber-300">
                Truy cập Google AI Studio để tạo key hoàn toàn miễn phí, sau đó dán vào ô bên dưới:
              </p>
              <a
                href="https://aistudio.google.com/api-keys"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 font-bold text-blue-600 dark:text-blue-400 hover:underline pt-1"
              >
                <span>https://aistudio.google.com/api-keys</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Model AI Selection Cards */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-blue-600" />
                <span>1. Chọn Mô Hình AI Mặc Định</span>
              </label>
              <span className="text-[11px] text-slate-400">
                (Tự động fallback nếu model quá tải)
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {AI_MODELS.map((model) => {
                const isSelected = selectedModel === model.id;
                return (
                  <button
                    key={model.id}
                    type="button"
                    onClick={() => setSelectedModel(model.id)}
                    className={`relative p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-950/40 shadow-md ring-2 ring-blue-500/20'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-1 mb-1.5">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                          {model.name}
                        </span>
                        {isSelected && (
                          <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mb-3">
                        {model.description}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[10px]">
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
                        {model.tag}
                      </span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                        <Zap className="w-3 h-3" />
                        {model.speed}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* API Key Input */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>2. Nhập Gemini API Key Của Bạn</span>
              </label>
              <span className="text-[11px] text-slate-400">
                Lưu an toàn trong trình duyệt (localStorage)
              </span>
            </div>

            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => {
                  setApiKey(e.target.value);
                  setErrorMessage('');
                }}
                placeholder="Dán mã API key (bắt đầu bằng AIzaSy...)"
                className="w-full px-4 py-3 pr-12 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition p-1"
                title={showKey ? 'Ẩn key' : 'Hiện key'}
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {errorMessage && (
              <div className="mt-2 text-xs text-red-600 dark:text-red-400 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}
          </div>

          {/* Security & Privacy note */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-slate-400 shrink-0" />
            <span>
              API Key được lưu trực tiếp trên thiết bị của bạn và chỉ gửi trực tiếp tới máy chủ Google Gemini. Khi hết quota, bạn có thể đổi key mới bất cứ lúc nào.
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            {apiKey ? (
              <span className="text-emerald-600 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Đã nhận diện API Key
              </span>
            ) : (
              <span className="text-amber-600 font-semibold">Chưa có key</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {!isMandatory ? (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Đóng
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-2 rounded-xl text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 underline transition cursor-pointer"
              >
                Vẽ ngoại tuyến (không có AI)
              </button>
            )}

            <button
              type="button"
              onClick={handleSave}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold text-white transition flex items-center gap-1.5 shadow-md cursor-pointer ${
                isSavedSuccess
                  ? 'bg-emerald-600'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
              }`}
            >
              {isSavedSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Đã Lưu Thành Công!</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Lưu Cấu Hình &amp; Bắt Đầu</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
