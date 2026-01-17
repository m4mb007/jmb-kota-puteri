import RegisterForm from './register-form';

export default function RegisterPage() {
  return (
    <main className="flex items-center justify-center md:h-screen">
      <div className="relative mx-auto flex w-full max-w-[400px] flex-col space-y-2.5 p-4 md:-mt-32">
        <div className="flex w-full items-end rounded-lg bg-blue-500 p-3 md:h-36">
          <div className="w-full text-white">
            <h1 className="text-2xl font-bold">JMB Idaman Kota Puteri</h1>
            <p className="text-sm mt-1">Daftar Akaun Baru</p>
          </div>
        </div>
        <RegisterForm />
      </div>
    </main>
  );
}

