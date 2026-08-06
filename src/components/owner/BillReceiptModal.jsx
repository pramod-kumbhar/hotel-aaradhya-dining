import React from 'react';
import { useApp } from '../../context/AppContext';
import { HOTEL_INFO } from '../../data/menuData';
import { Printer, X, MessageSquare } from 'lucide-react';

export const BillReceiptModal = ({ isOpen, onClose, order }) => {
  const { lang, t } = useApp();

  const [customPhone, setCustomPhone] = React.useState(order?.customerPhone || '');

  if (!isOpen || !order) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleSendWhatsApp = () => {
    const targetPhone = customPhone || order.customerPhone || '';
    const cleanPhone = targetPhone.replace(/\D/g, '');
    if (!cleanPhone) {
      alert(lang === 'mr' ? 'कृपया व्हॉट्सॲप पावती पाठवण्यासाठी मोबाईल नंबर प्रविष्ट करा' : 'Please enter mobile number to send WhatsApp receipt');
      return;
    }
    const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    
    const itemsList = order.items.map(i => `• ${i.nameMr} x ${i.quantity} = ₹${i.price * i.quantity}`).join('%0A');
    const msg = `🚩 *हॉटेल आराध्या डायनिंग - डिजिटल बिल पावती* 🚩%0A%0A*ऑर्डर क्र:* ${order.id}%0A*स्थान/टेबल:* ${order.tableNo}%0A*ग्राहक:* ${encodeURIComponent(order.customerName || '')}%0A%0A*ऑर्डर केलेले पदार्थ:*%0A${itemsList}%0A%0A*एकूण देय बिल: ₹${order.grandTotal}/-*%0A*पेमेंट प्रकार:* ${order.paymentMethod === 'Udhar' ? '📝 उधार खाते' : order.paymentMethod === 'UPI' ? '📱 UPI' : '💵 Cash'}%0A%0Aधन्यवाद! पुन्हा अवश्य या! 🙏`;
    
    window.open(`https://api.whatsapp.com/send?phone=${formattedPhone}&text=${msg}`, '_blank');
  };

  const formattedDate = new Date(order.timestamp).toLocaleDateString('mr-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
  const formattedTime = new Date(order.timestamp).toLocaleTimeString('mr-IN', {
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/85 backdrop-blur-md animate-fade-in print-modal-container">
      <div className="bg-stone-900 border border-amber-600/40 rounded-3xl max-w-md w-full p-4 sm:p-5 shadow-2xl space-y-3.5 relative overflow-hidden max-h-[92vh] overflow-y-auto print-modal-container">
        
        {/* Modal Controls */}
        <div className="flex items-center justify-between no-print border-b border-stone-800 pb-2.5">
          <h3 className="text-sm font-black text-amber-400 flex items-center gap-1.5">
            <Printer className="w-4 h-4" />
            <span>बिल पावती (Bill Receipt)</span>
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg bg-stone-800 text-stone-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Printable Receipt Paper Container */}
        <div
          id="printable-bill"
          className="bg-stone-950 p-4 sm:p-5 rounded-2xl border-2 border-stone-700 font-mono text-stone-100 text-xs space-y-3.5 shadow-inner"
        >
          {/* Header Credentials */}
          <div className="text-center space-y-1 pb-3 border-b border-dashed border-stone-600">
            <div className="text-lg font-black tracking-tight text-amber-400 uppercase">
              {HOTEL_INFO.nameMr}
            </div>
            <div className="text-[11px] text-stone-300 font-sans font-bold">
              {HOTEL_INFO.nameEn}
            </div>
            <div className="text-[11px] text-stone-300">
              {HOTEL_INFO.addressMr}
            </div>
            <div className="text-[11px] text-stone-200 font-bold font-mono pt-0.5">
              फोन: {HOTEL_INFO.phone} | GSTIN: {HOTEL_INFO.gstin}
            </div>
          </div>

          {/* Order Metadata Credentials */}
          <div className="grid grid-cols-2 gap-1.5 text-xs pb-3 border-b border-dashed border-stone-600 font-bold">
            <div>
              <span className="text-stone-400">बिल क्र: </span>
              <strong className="text-amber-400 text-sm">{order.id}</strong>
            </div>
            <div className="text-right">
              <span className="text-stone-400">स्थान / टेबल: </span>
              <strong className="text-amber-400 text-sm">{order.tableNo}</strong>
            </div>
            <div>
              <span className="text-stone-400">दिनांक: </span>
              <span className="text-stone-200">{formattedDate}</span>
            </div>
            <div className="text-right">
              <span className="text-stone-400">वेळ: </span>
              <span className="text-stone-200">{formattedTime}</span>
            </div>
            <div className="col-span-2 pt-1 border-t border-stone-800/80 flex items-center justify-between text-xs">
              <div>
                <span className="text-stone-400">ग्राहक नाव: </span>
                <strong className="text-stone-100">{order.customerName || '-'}</strong>
              </div>
              {order.customerPhone && (
                <div>
                  <span className="text-stone-400">मोबाईल: </span>
                  <strong className="text-amber-300 font-mono">+91 {order.customerPhone}</strong>
                </div>
              )}
            </div>
          </div>

          {/* Itemized Billing Table */}
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-stone-600 text-stone-300">
                <th className="pb-1.5 font-extrabold">पदार्थ</th>
                <th className="pb-1.5 text-center font-extrabold">नग</th>
                <th className="pb-1.5 text-right font-extrabold">दर</th>
                <th className="pb-1.5 text-right font-extrabold">एकूण</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800/80">
              {order.items?.map((item, idx) => (
                <tr key={idx}>
                  <td className="py-2 font-bold text-stone-100">
                    {item.nameMr}
                    {item.extraThalis > 0 && (
                      <div className="text-[10px] font-normal text-amber-400">
                        + {item.extraThalis} एक्स्ट्रा ताट (₹60)
                      </div>
                    )}
                  </td>
                  <td className="py-2 text-center font-black">{item.quantity}</td>
                  <td className="py-2 text-right font-mono">₹{item.price}</td>
                  <td className="py-2 text-right font-black text-amber-300 font-mono">
                    ₹{item.price * item.quantity + (item.extraThalis || 0) * 60}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Financial Summary */}
          <div className="pt-2.5 border-t border-dashed border-stone-600 space-y-1.5 text-xs">
            <div className="flex justify-between text-stone-300">
              <span>पदार्थ एकूण:</span>
              <span className="font-mono font-bold">₹{order.itemTotal || order.grandTotal}</span>
            </div>
            {order.extraThaliTotal > 0 && (
              <div className="flex justify-between text-stone-300">
                <span>एक्स्ट्रा ताट आकार:</span>
                <span className="font-mono font-bold">₹{order.extraThaliTotal}</span>
              </div>
            )}
            <div className="flex justify-between font-black text-base text-amber-400 pt-1.5 border-t border-stone-600">
              <span>एकूण देय बिल:</span>
              <span className="font-mono text-lg">₹{order.grandTotal}/-</span>
            </div>
            <div className="flex justify-between text-xs text-stone-300 pt-1">
              <span>पेमेंट प्रकार:</span>
              <span className={`font-black uppercase ${order.paymentMethod === 'Udhar' ? 'text-red-400' : 'text-emerald-400'}`}>
                {order.paymentMethod === 'Udhar' ? '📝 उधार खाते (Pending Credit)' : order.paymentMethod === 'UPI' ? '📱 UPI (Online Pay)' : '💵 Cash (नगद)'}
              </span>
            </div>
          </div>

          {/* Printable UPI QR Code */}
          {order.paymentMethod === 'UPI' && (
            <div className="text-center pt-2.5 pb-1 border-t border-dashed border-stone-600 flex flex-col items-center gap-1">
              <span className="text-xs text-amber-300 font-bold">स्कॅन करून ऑनलाईन बिल भरा</span>
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(
                  `upi://pay?pa=${HOTEL_INFO.upiId}&pn=${encodeURIComponent(HOTEL_INFO.upiName)}&am=${order.grandTotal}&cu=INR`
                )}`}
                alt="Print Bill QR Code"
                className="w-24 h-24 bg-white p-1 rounded-lg border border-stone-600 shadow"
              />
              <span className="text-[10px] text-stone-300 font-mono font-bold">UPI ID: {HOTEL_INFO.upiId}</span>
            </div>
          )}

          {/* Footer Notice */}
          <div className="text-center pt-2.5 border-t border-dashed border-stone-600 space-y-1 text-xs text-stone-300">
            <p className="font-black text-amber-400">{t.thankYou || 'धन्यवाद! पुन्हा अवश्य या!'}</p>
            <p className="text-[10px] text-stone-400 font-bold">अन्न हे पूर्ण ब्रह्म आहे. अन्नाची नासाडी करू नका.</p>
          </div>
        </div>

        {/* Print & Digital Action Controls */}
        <div className="no-print space-y-2.5 pt-0.5">
          {/* Optional Mobile Phone Input for WhatsApp */}
          {!order.customerPhone && (
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-stone-300 block">
                📱 WhatsApp वर पावती पाठवण्यासाठी मोबाईल नंबर:
              </label>
              <input
                type="tel"
                maxLength="10"
                placeholder="१० अंकी मोबाईल नंबर..."
                value={customPhone}
                onChange={(e) => setCustomPhone(e.target.value.replace(/\D/g, ''))}
                className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-xs text-amber-300 font-bold placeholder-stone-500 focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-stone-950 font-black text-xs flex items-center justify-center gap-1.5 hover:opacity-90 transition shadow-lg min-h-[40px]"
            >
              <Printer className="w-4 h-4" />
              <span>पावती प्रिंट करा</span>
            </button>

            <button
              type="button"
              onClick={handleSendWhatsApp}
              className="py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-black text-xs flex items-center justify-center gap-1.5 transition shadow min-h-[40px]"
            >
              <MessageSquare className="w-4 h-4 text-emerald-200" />
              <span>📱 WhatsApp पावती</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

