import { useState, useRef } from "react";
import SignatureCanvas from "react-signature-canvas";
import { useDispatch, useSelector } from "react-redux";
import { uploadFile } from "../../../redux/slices/uploadSlice";
import { Loader2, X, Eraser, PenLine, Upload } from "lucide-react";
import { toast } from "react-hot-toast";

export default function LoanRequestModal({ open, plan, onClose, onSubmit, submitting }) {
  const dispatch = useDispatch();
  const { uploading } = useSelector((state) => state.upload);
  const [guarantor, setGuarantor] = useState({
    name: "",
    address: "",
    phone: "",
    relationship: "",
  });
  const sigCanvas = useRef(null);
  const [isSigned, setIsSigned] = useState(false);
  const [uploadedSignatureUrl, setUploadedSignatureUrl] = useState(null);

  if (!open || !plan) return null;

  const loanAmount = plan.dailyContribution * 30;

  const handleGuarantorChange = (e) => {
    const { name, value } = e.target;
    setGuarantor((prev) => ({ ...prev, [name]: value }));
  };

  const clearSignature = () => {
    sigCanvas.current.clear();
    setIsSigned(false);
    setUploadedSignatureUrl(null);
  };

  const dataURLtoFile = (dataurl, filename) => {
    let arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
    bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
    while(n--){
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, {type:mime});
  }

  const handleUploadSignature = async () => {
    console.log("handleUploadSignature triggered");
    if (!sigCanvas.current || sigCanvas.current.isEmpty()) {
      console.log("Canvas is empty or ref is null");
      toast.error("Please sign before uploading");
      return;
    }

    try {
      const signatureDataURL = sigCanvas.current.getCanvas().toDataURL("image/png");
      console.log("Signature data URL length:", signatureDataURL.length);
      
      const signatureFile = dataURLtoFile(signatureDataURL, `signature-${plan._id}-${Date.now()}.png`);
      console.log("Converted to file:", signatureFile.name, signatureFile.size);

      dispatch(uploadFile({ file: signatureFile, folderName: "signatures" }))
        .unwrap()
        .then((response) => {
          console.log("Upload successful, response:", response);
          setUploadedSignatureUrl(response.data);
          toast.success("Signature uploaded successfully");
        })
        .catch((error) => {
          console.error("Upload thunk rejected:", error);
          toast.error(error || "Failed to upload signature");
        });
    } catch (err) {
      console.error("Error in handleUploadSignature:", err);
      toast.error("An error occurred during signature processing");
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!uploadedSignatureUrl) {
      toast.error("Please upload the signature first");
      return;
    }
    
    onSubmit({
      guarantor,
      customerSignature: uploadedSignatureUrl,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 py-10">
      <div className="relative w-full max-w-2xl rounded-3xl bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-primary/80">Loan Request</p>
            <h2 className="text-lg font-semibold text-slate-900">Request Loan on {plan.planName}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="max-h-[70vh] overflow-y-auto px-6 py-6">
          <div className="mb-6 rounded-xl bg-blue-50 p-4 text-blue-800">
            <h3 className="mb-2 font-semibold">Loan Terms</h3>
            <ul className="list-inside list-disc space-y-1 text-sm">
              <li>Loan Amount: <strong>₦{loanAmount.toLocaleString()}</strong> (30 days contribution)</li>
              <li>Duration: <strong>32 days</strong></li>
              <li>Fee: <strong>₦{plan.dailyContribution.toLocaleString()}</strong> (admin fee)</li>
              <li>Note: Existing contributions will be held against the loan.</li>
            </ul>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-slate-900 border-b border-slate-100 pb-2">Guarantor Information</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="name" className="block text-sm font-medium text-slate-600">Full Name</label>
                  <input
                    id="name"
                    name="name"
                    value={guarantor.name}
                    onChange={handleGuarantorChange}
                    required
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="phone" className="block text-sm font-medium text-slate-600">Phone</label>
                  <input
                    id="phone"
                    name="phone"
                    value={guarantor.phone}
                    onChange={handleGuarantorChange}
                    required
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="address" className="block text-sm font-medium text-slate-600">Address</label>
                  <input
                    id="address"
                    name="address"
                    value={guarantor.address}
                    onChange={handleGuarantorChange}
                    required
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="relationship" className="block text-sm font-medium text-slate-600">Relationship</label>
                  <input
                    id="relationship"
                    name="relationship"
                    value={guarantor.relationship}
                    onChange={handleGuarantorChange}
                    required
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="font-semibold text-slate-900">Customer Signature</h3>
                <button
                  type="button"
                  onClick={clearSignature}
                  className="text-xs font-semibold text-rose-600 hover:underline flex items-center gap-1"
                >
                  <Eraser className="h-3 w-3" /> Clear
                </button>
              </div>
              <div className="rounded-xl border border-slate-300 bg-slate-50">
                 <SignatureCanvas
                    ref={sigCanvas}
                    penColor="black"
                    canvasProps={{
                      className: "w-full h-40 rounded-xl cursor-crosshair",
                    }}
                    onEnd={() => setIsSigned(true)}
                  />
              </div>
              
              <div className="flex justify-center">
                 <button
                   type="button"
                   onClick={handleUploadSignature}
                   disabled={uploading || !isSigned || uploadedSignatureUrl}
                   className="inline-flex items-center gap-2 rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700 disabled:opacity-50"
                 >
                   {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                   {uploadedSignatureUrl ? "Signature Uploaded" : "Upload Signature"}
                 </button>
              </div>
              <p className="text-xs text-slate-500 text-center">Sign above and click Upload before submitting.</p>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !uploadedSignatureUrl}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-primary/50"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <PenLine className="h-4 w-4" />}
                Submit Request
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
