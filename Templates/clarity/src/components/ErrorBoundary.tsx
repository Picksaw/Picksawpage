import { Component, ErrorInfo, ReactNode } from 'react';
import { logger } from '../utils/logger';
import { RefreshCw, PhoneCall } from 'lucide-react';
import { CLINIC_CONTACT } from '../config/clinicContact';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error('ReactErrorBoundary', error.message, {
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full flex items-center justify-center bg-[#E4F0F6] px-6 py-12 text-right dir-rtl">
          <div className="max-w-md w-full p-8 rounded-3xl bg-[#F6E3E6] border border-[#CFE8F3] shadow-xl text-center space-y-6">
            <div className="w-12 h-12 mx-auto rounded-full bg-[#F0D8DC]/60 border border-[#D9A6AE]/40 flex items-center justify-center text-[#203A43]">
              <span className="text-xl font-bold">!</span>
            </div>

            <div className="space-y-2">
              <h1 className="text-xl font-bold text-[#203A43]">
                خطایی در نمایش صفحه رخ داد
              </h1>
              <p className="text-sm text-[#69767C] leading-relaxed">
                لطفاً صفحه را دوباره بارگذاری کنید یا از طریق تماس تلفنی با کلینیک در ارتباط باشید.
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
              <button
                type="button"
                onClick={this.handleReload}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-[#203A43] text-[#FFFDFC] text-xs font-semibold hover:bg-[#203A43]/90 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>بارگذاری مجدد صفحه</span>
              </button>

              <a
                href={CLINIC_CONTACT.phone.telUri}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-[#CFE8F3]/60 text-[#203A43] border border-[#9FCFE0]/50 text-xs font-semibold hover:bg-[#CFE8F3] transition-colors"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>تماس با کلینیک</span>
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
