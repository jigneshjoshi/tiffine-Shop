import React from 'react';
import { ShieldAlert, FileText, CheckCircle2, X, Download } from 'lucide-react';

export default function DeclarationModal({ isOpen, onClose, ownerName, centerName, address }) {
  if (!isOpen) return null;

  const dateStr = new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl sm:rounded-3xl max-w-3xl w-full p-4 sm:p-8 shadow-2xl border border-slate-100 relative my-4 sm:my-8 max-h-[92vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 mb-4 sm:mb-6">
          <div className="p-2.5 sm:p-3 bg-amber-50 rounded-2xl text-amber-600 flex-shrink-0">
            <ShieldAlert className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900">Legal Food Safety Undertaking</h2>
            <p className="text-xs sm:text-sm text-slate-500">खाद्य सुरक्षा एवं कानूनी जवाबदेही घोषणा पत्र (Bilingual)</p>
          </div>
        </div>

        <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2 text-slate-700 text-sm leading-relaxed border-t border-b py-4 border-slate-100">
          {/* Header Info */}
          <div className="bg-slate-50 p-4 rounded-xl space-y-1 text-xs sm:text-sm font-medium">
            <p><span className="text-slate-500">Center Name:</span> {centerName || '[Tiffin Center Name]'}</p>
            <p><span className="text-slate-500">Owner Name:</span> {ownerName || '[Owner Full Name]'}</p>
            <p><span className="text-slate-500">Address:</span> {address || '[Registered Location]'}</p>
            <p><span className="text-slate-500">Date:</span> {dateStr}</p>
          </div>

          {/* Hindi Declaration Section */}
          <div className="bg-rose-50/50 p-4 rounded-xl border border-rose-100">
            <h3 className="font-bold text-rose-900 mb-2 flex items-center gap-2">
              <span>🇮🇳 हिंदी घोषणा पत्र (Hindi Declaration)</span>
            </h3>
            <p className="text-slate-800 font-hindi">
              "मैं <strong>{ownerName || '__________________'}</strong> (स्वामी: {centerName || '__________________'}), एतद्द्वारा यह कानूनी शपथपूर्वक घोषणा करता/करती हूँ कि मेरे टिफिन सेंटर द्वारा तैयार, पैक एवं ग्राहकों को delivered किया गया समस्त भोजन पूरी तरह से स्वच्छ, ताजा, स्वास्थ्यप्रद एवं FSSAI/खाद्य सुरक्षा मानकों के अनुरूप होगा।
            </p>
            <p className="mt-2 text-slate-800 font-hindi">
              मैं यह स्पष्ट रूप से स्वीकार करता/करती हूँ कि भोजन की गुणवत्ता में किसी भी प्रकार की कमी, मिलावट, बासीपन या हानिकारक तत्व पाए जाने पर होने वाली किसी भी स्वास्थ्य हानि, फ़ूड पॉइजनिंग अथवा कानूनी कार्रवाई के लिए <strong>केवल और केवल मैं स्वयं कानूनी एवं आपराधिक रूप से जिम्मेदार रहूँगा/रहूँगी (जिसमें सजा व जेल तक शामिल है)</strong>। 
            </p>
            <p className="mt-2 text-slate-800 font-hindi font-medium">
              ऑनलाइन प्लेटफ़ॉर्म <strong>'APKA Tiffine Center'</strong> केवल एक एग्रीगेटर की भूमिका निभाता है तथा भोजन की गुणवत्ता अथवा किसी कानूनी विवाद में प्लेटफ़ॉर्म स्वामी/संचालक की शून्य (0%) जवाबदेही होगी।"
            </p>
          </div>

          {/* English Declaration Section */}
          <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-100">
            <h3 className="font-bold text-amber-900 mb-2 flex items-center gap-2">
              <span>🇬🇧 English Legal Undertaking</span>
            </h3>
            <p className="text-slate-800">
              "I, <strong>{ownerName || '__________________'}</strong>, Owner of <strong>{centerName || '__________________'}</strong>, hereby solemnly affirm and declare that all food items prepared, packed, and delivered through my Tiffin Center strictly comply with hygiene and food safety standards.
            </p>
            <p className="mt-2 text-slate-800">
              I explicitly agree that any health risk, food poisoning, quality defect, or illegal contamination shall be my <strong>sole personal, legal, and criminal liability under Indian law (including penalty & imprisonment)</strong>.
            </p>
            <p className="mt-2 text-slate-800 font-medium">
              The platform <strong>'APKA Tiffine Center'</strong> acts strictly as a listing technology aggregator and carries zero legal or operational liability for food safety."
            </p>
          </div>

          {/* Verification Checkpoint */}
          <div className="flex items-start space-x-3 p-3 bg-emerald-50 text-emerald-900 rounded-xl text-xs sm:text-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <p>
              By uploading your digital signature / signed copy during registration, you confirm that you have read, understood, and accepted this legal declaration in both Hindi & English.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between mt-6 pt-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50 transition text-sm font-semibold"
          >
            <Download className="w-4 h-4" /> Download / Print Form
          </button>

          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-semibold transition text-sm shadow-md shadow-orange-500/20"
          >
            I Agree & Accept
          </button>
        </div>
      </div>
    </div>
  );
}
