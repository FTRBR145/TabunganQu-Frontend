import { formatRupiah } from '../../utils/helpers'

export default function SummaryBar({ totalSaldo, totalPengeluaran }) {
  return (
    <div className="grid grid-cols-2 gap-[10px] mb-6 animate-[fadeIn_400ms_ease] md:gap-4 md:mb-6">
      
      <div className="flex flex-col items-start gap-1.5 p-[14px] px-4 bg-white rounded-lg border border-gray-100 border-l-4 border-l-emerald-500 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md min-[401px]:flex-row min-[401px]:items-center min-[401px]:gap-2.5 md:p-5 md:px-6 md:gap-4 md:rounded-xl">
        <div className="flex items-center justify-center w-[38px] h-[38px] text-[22px] bg-gray-50 rounded-md md:w-12 md:h-12 md:text-[28px]">
          💰
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[11px] text-gray-500 font-medium md:text-[13px]">
            Total Saldo
          </span>
          <span className="text-[16px] font-bold text-emerald-700 tracking-[-0.5px] md:text-[22px]">
            {formatRupiah(totalSaldo)}
          </span>
        </div>
      </div>

      <div className="flex flex-col items-start gap-1.5 p-[14px] px-4 bg-white rounded-lg border border-gray-100 border-l-4 border-l-red-500 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md min-[401px]:flex-row min-[401px]:items-center min-[401px]:gap-2.5 md:p-5 md:px-6 md:gap-4 md:rounded-xl">
        <div className="flex items-center justify-center w-[38px] h-[38px] text-[22px] bg-gray-50 rounded-md md:w-12 md:h-12 md:text-[28px]">
          📉
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[11px] text-gray-500 font-medium md:text-[13px]">
            Total Pengeluaran
          </span>
          <span className="text-[16px] font-bold text-red-600 tracking-[-0.5px] md:text-[22px]">
            {formatRupiah(totalPengeluaran)}
          </span>
        </div>
      </div>

    </div>
  )
}