export default function PortalLoading() {
  return (
    <div
      aria-busy="true"
      aria-label="Carregando notícias do portal"
      className="min-h-screen bg-white"
    >
      <div className="h-16 border-b border-[#EAF0F2] bg-white" />
      <div className="h-10 border-b-2 border-[#D6A843] bg-[#123B50]" />
      <div className="mx-auto mt-4 max-w-[1200px] space-y-6 px-4 sm:px-6">
        <div className="h-10 animate-pulse rounded-sm bg-[#EAF0F2]" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="space-y-5 lg:col-span-8">
            <div className="h-24 animate-pulse rounded-sm bg-[#EAF0F2]" />
            <div className="grid grid-cols-1 gap-5 md:grid-cols-12">
              <div className="h-96 animate-pulse rounded-sm bg-[#EAF0F2] md:col-span-7" />
              <div className="space-y-4 md:col-span-5">
                <div className="h-44 animate-pulse rounded-sm bg-[#EAF0F2]" />
                <div className="h-44 animate-pulse rounded-sm bg-[#EAF0F2]" />
              </div>
            </div>
          </div>
          <div className="space-y-4 lg:col-span-4">
            <div className="h-64 animate-pulse rounded-sm bg-[#EAF0F2]" />
            <div className="h-80 animate-pulse rounded-sm bg-[#EAF0F2]" />
          </div>
        </div>
      </div>
    </div>
  );
}

