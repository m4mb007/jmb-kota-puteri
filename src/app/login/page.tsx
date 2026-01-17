import LoginForm from './login-form';
import { Building2 } from 'lucide-react';

export default function LoginPage() {
  return (
    <main className="min-h-screen grid lg:grid-cols-2">
      {/* Left Side: Illustration & Branding */}
      <div className="hidden lg:flex flex-col justify-between p-12 bg-blue-600 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-blue-500 rounded-full blur-3xl opacity-50" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-blue-700 rounded-full blur-3xl opacity-50" />
        
        <div className="relative z-10 flex items-center gap-2">
          <div className="bg-white/10 p-2 rounded-lg backdrop-blur-sm">
            <Building2 className="w-8 h-8" />
          </div>
          <span className="text-2xl font-bold tracking-tight">JMB Idaman</span>
        </div>

        <div className="relative z-10">
          <h2 className="text-4xl font-bold leading-tight mb-4">
            Pengurusan Strata <br />
            Lebih Mudah & Efisien
          </h2>
          <p className="text-blue-100 text-lg max-w-md">
            Satu platform untuk semua keperluan penduduk dan pengurusan JMB Idaman Kota Puteri.
          </p>
        </div>

        <div className="relative z-10 text-blue-200 text-sm">
          © {new Date().getFullYear()} JMB Idaman Kota Puteri. Hak Cipta Terpelihara.
        </div>
      </div>

      {/* Right Side: Login Form */}
      <div className="flex items-center justify-center p-8 bg-slate-50">
        <div className="w-full max-w-md space-y-8">
          <div className="flex flex-col space-y-2 text-center lg:text-left">
            <div className="lg:hidden flex justify-center mb-6">
              <div className="bg-blue-600 p-3 rounded-2xl shadow-lg shadow-blue-200">
                <Building2 className="w-10 h-10 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Selamat Datang</h1>
            <p className="text-slate-500">
              Log masuk ke akaun anda untuk mula mengurus.
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
            <LoginForm />
          </div>

          <p className="text-center text-sm text-slate-500">
            Perlukan bantuan? <a href="#" className="text-blue-600 hover:underline font-medium">Hubungi Pihak Pengurusan</a>
          </p>
        </div>
      </div>
    </main>
  );
}
