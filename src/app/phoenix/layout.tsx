import type { ReactNode } from "react";

/**
 * Phoenix — повноекранний shell поза звичайним потоком документа.
 * Інакше висота таблиці накопичується в body і з’являється скрол сторінки замість внутрішнього.
 */
export default function PhoenixLayout({ children }: { children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-[1] flex flex-col overflow-hidden">
      {children}
    </div>
  );
}
