import { getCurrentUserId } from "@/lib/auth";
"use client";

import React, { useRef, useState, useEffect } from "react";
import Header from "@/components/Header";
import SignatureCanvas from "react-signature-canvas";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export default function TandaTanganClient() {
  const sigCanvasRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const pdfContainerRef = useRef<HTMLDivElement>(null);

  // States
  const [hasUploaded, setHasUploaded] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  
  // PDF State
  const [numPages, setNumPages] = useState<number>(0);
  const [targetPage, setTargetPage] = useState<number>(1);
  const [originalPageWidth, setOriginalPageWidth] = useState(595);
  
  const [signatureImg, setSignatureImg] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [signMethod, setSignMethod] = useState<"draw" | "upload">("draw");
  
  const [baseRenderWidth, setBaseRenderWidth] = useState(800);
  const [zoomLevel, setZoomLevel] = useState(1.0);

  // Auto-fit PDF width on first load
  useEffect(() => {
    if (pdfContainerRef.current) {
      const available = pdfContainerRef.current.clientWidth - 100;
      if (available > 300) setBaseRenderWidth(available);
    }
  }, [hasUploaded]);
  
  const [pos, setPos] = useState({ x: 250, y: 300 });
  const [sigWidth, setSigWidth] = useState(200);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [lockedSignatures, setLockedSignatures] = useState<any[]>([]);
  
  const dragOffset = useRef({ x: 0, y: 0 });
  const resizeStart = useRef({ x: 0, w: 200 });
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);
  
  const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === "application/pdf") {
      setUploadedFile(file);
      setHasUploaded(true);
      setTargetPage(1);
      setZoomLevel(1.0);
    } else {
      alert("Mohon unggah file dengan format PDF.");
    }
  };

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    pageRefs.current = new Array(numPages).fill(null);
  };

  const onPageLoadSuccess = (page: any) => {
    if (page.pageNumber === 1) {
      setOriginalPageWidth(page.originalWidth);
    }
  };

  // Sensor Pintar: Deteksi halaman mana yang paling terlihat di layar saat ini (Native Scroll)
  const getVisiblePage = () => {
    let bestPage = 1;
    let maxVisibleArea = 0;
    const container = pdfContainerRef.current;
    if (!container) return 1;

    const containerRect = container.getBoundingClientRect();

    pageRefs.current.forEach((el, index) => {
      if (!el) return;
      const rect = el.getBoundingClientRect();
      // Hitung irisan area yang terlihat antara kontainer dan halaman
      const visibleTop = Math.max(containerRect.top, rect.top);
      const visibleBottom = Math.min(containerRect.bottom, rect.bottom);
      const visibleHeight = Math.max(0, visibleBottom - visibleTop);
      
      if (visibleHeight > maxVisibleArea) {
        maxVisibleArea = visibleHeight;
        bestPage = index + 1;
      }
    });
    return bestPage;
  };

  // Pendaratan TTD di tengah layar (menyesuaikan halaman yg aktif)
  const centerSignatureSmartly = (pageNumToUse?: number) => {
    const pageNum = pageNumToUse || getVisiblePage();
    setTargetPage(pageNum);
    
    const container = pdfContainerRef.current;
    const pageEl = pageRefs.current[pageNum - 1];
    
    if (container && pageEl) {
      const containerCenterY = container.scrollTop + (container.clientHeight / 2);
      let localY = containerCenterY - pageEl.offsetTop;
      
      // Batasan agar TTD tidak keluar dari halaman
      if (localY < 50) localY = 50;
      if (localY > pageEl.clientHeight - sigWidth) localY = pageEl.clientHeight - sigWidth;
      
      setPos({ 
        x: (pageEl.clientWidth / 2) - (sigWidth / 2), 
        y: localY - (sigWidth / 4) 
      });
    }
  };

  const handleZoom = (newZoom: number) => {
    const ratio = newZoom / zoomLevel;
    // Skalakan posisi dan ukuran TTD agar visualnya menempel erat pada posisinya
    setPos(prev => ({ x: prev.x * ratio, y: prev.y * ratio }));
    setSigWidth(prev => prev * ratio);
    setZoomLevel(newZoom);
  };

  const saveSignature = () => {
    if (sigCanvasRef.current && !sigCanvasRef.current.isEmpty()) {
      const dataURL = sigCanvasRef.current.getTrimmedCanvas().toDataURL("image/png");
      setSignatureImg(dataURL);
      setTimeout(() => centerSignatureSmartly(), 50);
    }
  };

  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setSignatureImg(event.target?.result as string);
        setTimeout(() => centerSignatureSmartly(), 50);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearCanvas = () => {
    if (sigCanvasRef.current) sigCanvasRef.current.clear();
  };

  const closeWorkspace = () => {
    setHasUploaded(false);
    setUploadedFile(null);
    setSignatureImg(null);
    setNumPages(0);
    setZoomLevel(1.0);
  };

  const handleDownload = async () => {
    if ((!signatureImg && lockedSignatures.length === 0) || !uploadedFile) return;
    setIsProcessing(true);

    try {
      const pageEl = pageRefs.current[targetPage - 1];
      if (!pageEl) throw new Error("Halaman tidak ditemukan.");

      const canvasWidth = pageEl.clientWidth;
      const canvasHeight = pageEl.clientHeight;

      const placements = [...lockedSignatures];
      
      if (signatureImg) {
        placements.push({
          x: pos.x / canvasWidth,
          y: pos.y / canvasHeight,
          width: sigWidth / canvasWidth,
          page: targetPage
        });
      }

      const formData = new FormData();
      formData.append("file", uploadedFile);
      formData.append("signatureBase64", signatureImg || lockedSignatures[0]?.base64);
      formData.append("placementsJson", JSON.stringify(placements));

      const response = await fetch("http://localhost:8080/api/documents/quick-sign", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Terjadi kesalahan saat memproses stempel di server.");

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = `Signed_${uploadedFile.name}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      
      alert("Sukses! Dokumen telah distempel presisi pada Halaman " + targetPage);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Mouse Handlers for Drag & Resize dengan akurasi Native
  const handleMouseDown = (e: React.MouseEvent) => {
    const rect = pageRefs.current[targetPage - 1]?.getBoundingClientRect();
    if (!rect) return;
    setIsDragging(true);
    dragOffset.current = {
      x: e.clientX - rect.left - pos.x,
      y: e.clientY - rect.top - pos.y,
    };
  };

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsResizing(true);
    resizeStart.current = { x: e.clientX, w: sigWidth };
  };

  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!isDragging && !isResizing) return;
      const rect = pageRefs.current[targetPage - 1]?.getBoundingClientRect();
      if (!rect) return;
      
      if (isResizing) {
        let newW = resizeStart.current.w + (e.clientX - resizeStart.current.x);
        if (newW < 20) newW = 20; 
        setSigWidth(newW);
      } else if (isDragging) {
        let newX = e.clientX - rect.left - dragOffset.current.x;
        let newY = e.clientY - rect.top - dragOffset.current.y;
        
        if (newX < 0) newX = 0;
        if (newY < 0) newY = 0;
        if (newX > rect.width - sigWidth) newX = rect.width - sigWidth;
        
        setPos({ x: newX, y: newY });
      }
    };

    const handleGlobalMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      window.addEventListener("mousemove", handleGlobalMouseMove);
      window.addEventListener("mouseup", handleGlobalMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleGlobalMouseMove);
      window.removeEventListener("mouseup", handleGlobalMouseUp);
    };
  }, [isDragging, isResizing, targetPage, sigWidth, pos]);

  const handleUnlockSignature = (lsObj: any) => {
    // Cari index asli dari lockedSignatures
    const indexToUnlock = lockedSignatures.indexOf(lsObj);
    if (indexToUnlock === -1) return;

    const updatedLocked = lockedSignatures.filter((_, i) => i !== indexToUnlock);

    if (signatureImg) {
      const pageEl = pageRefs.current[targetPage - 1];
      if (pageEl) {
        updatedLocked.push({
          x: pos.x / pageEl.clientWidth,
          y: pos.y / pageEl.clientHeight,
          width: sigWidth / pageEl.clientWidth,
          page: targetPage,
          base64: signatureImg
        });
      }
    }

    setLockedSignatures(updatedLocked);
    
    setSignatureImg(lsObj.base64);
    setTargetPage(lsObj.page);
    
    const newPageEl = pageRefs.current[lsObj.page - 1];
    const cw = newPageEl ? newPageEl.clientWidth : baseRenderWidth * zoomLevel;
    const ch = newPageEl ? newPageEl.clientHeight : cw * 1.414;
    
    setPos({ x: lsObj.x * cw, y: lsObj.y * ch });
    setSigWidth(lsObj.width * cw);
  };

  return (
    <div className="min-h-screen bg-[#f7f9fc]">
      <Header
        title="Tanda Tangan Cepat"
        breadcrumbs={[{ label: "SignFlow", href: "/dashboard" }, { label: "Alat" }, { label: "Tanda Tangan Cepat" }]}
      />

      {(isDragging || isResizing) && <div className="fixed inset-0 z-[9999] cursor-move" />}

      <main className="p-6 max-w-[1600px] mx-auto">
        {!hasUploaded ? (
          <div className="max-w-2xl mx-auto mt-10 bg-white p-10 rounded-3xl border border-gray-200 shadow-sm text-center">
            <div className="w-20 h-20 bg-[#006767]/10 text-[#006767] rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="material-symbols-outlined text-[40px]">upload_file</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Unggah Dokumen PDF Asli</h2>
            <p className="text-gray-500 text-sm mb-8">Pilih file PDF. Kami akan menampilkannya dengan sempurna agar Anda bisa menempatkan Tanda Tangan.</p>
            <input type="file" accept="application/pdf" className="hidden" ref={pdfInputRef} onChange={handlePdfUpload} />
            <div onClick={() => pdfInputRef.current?.click()} className="border-2 border-dashed border-[#006767]/30 bg-[#f7fffe] hover:bg-[#e6f7f7] rounded-2xl p-12 cursor-pointer transition-colors">
              <span className="material-symbols-outlined text-4xl text-[#006767] mb-3">cloud_upload</span>
              <p className="text-[#006767] font-semibold">Klik untuk memilih file PDF</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-6">
            
            {/* LEFT: Document Preview with Native Scroll */}
            <div className="flex-1 lg:w-3/5 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-[800px]">
              
              {/* Toolbar Atas PDF */}
              <div className="h-14 bg-gray-50 border-b border-gray-200 flex items-center justify-between px-4 z-10 relative">
                <div className="font-semibold text-sm text-gray-700 flex items-center gap-2 max-w-[40%] truncate">
                  <span className="material-symbols-outlined text-rose-500">picture_as_pdf</span>
                  <span className="truncate">{uploadedFile?.name}</span>
                </div>
                
                {/* Native Zoom Controls */}
                <div className="flex items-center gap-2 bg-white px-2 py-1 rounded-lg border border-gray-200 shadow-sm">
                  <button onClick={() => handleZoom(Math.max(0.5, zoomLevel - 0.2))} className="p-1 hover:bg-gray-100 rounded text-gray-600 flex items-center">
                    <span className="material-symbols-outlined text-[18px]">zoom_out</span>
                  </button>
                  <span className="text-xs font-bold text-gray-700 w-12 text-center">{Math.round(zoomLevel * 100)}%</span>
                  <button onClick={() => handleZoom(Math.min(3.0, zoomLevel + 0.2))} className="p-1 hover:bg-gray-100 rounded text-gray-600 flex items-center">
                    <span className="material-symbols-outlined text-[18px]">zoom_in</span>
                  </button>
                </div>

                <button onClick={closeWorkspace} className="text-xs font-semibold text-rose-600 hover:underline">
                  Ganti File
                </button>
              </div>

              {/* AREA RENDER PDF - Native Scroll & Min-W-Max prevent cropping */}
              <div ref={pdfContainerRef} className="flex-1 bg-gray-300 overflow-auto relative select-none">
                <div className="min-w-max p-8 flex flex-col items-center gap-8">
                  {uploadedFile && (
                    <Document file={uploadedFile} onLoadSuccess={onDocumentLoadSuccess} className="flex flex-col items-center gap-8">
                      {Array.from(new Array(numPages), (el, index) => {
                        const pageNum = index + 1;
                        const isTarget = pageNum === targetPage;

                        return (
                          <div 
                            key={`page_${pageNum}`} 
                            ref={(el) => { pageRefs.current[index] = el; }}
                            onClick={() => {
                              if (signatureImg && !isTarget) {
                                centerSignatureSmartly(pageNum);
                              } else {
                                setTargetPage(pageNum);
                              }
                            }}
                            className={`relative bg-white shadow-lg transition-all ${isTarget ? 'ring-4 ring-[#006767]' : 'cursor-pointer hover:ring-2 hover:ring-gray-400'}`}
                          >
                            {!isTarget && (
                              <div className="absolute top-2 left-2 bg-gray-900/60 text-white text-[10px] px-2 py-1 rounded-md z-10 pointer-events-none">
                                Halaman {pageNum} (Klik untuk memindah TTD)
                              </div>
                            )}

                            <Page 
                              pageNumber={pageNum} 
                              width={baseRenderWidth * zoomLevel} 
                              onLoadSuccess={onPageLoadSuccess}
                              renderTextLayer={false} 
                              renderAnnotationLayer={false} 
                            />

                            {/* Render Locked Signatures */}
                            {lockedSignatures
                              .filter((ls) => ls.page === pageNum)
                              .map((ls, i) => {
                                const pageEl = pageRefs.current[pageNum - 1];
                                const cw = pageEl ? pageEl.clientWidth : baseRenderWidth * zoomLevel;
                                const ch = pageEl ? pageEl.clientHeight : cw * 1.414;
                                return (
                                  <div
                                    key={`locked_${i}`}
                                    style={{ left: ls.x * cw, top: ls.y * ch, width: ls.width * cw }}
                                    className="absolute z-40 opacity-90 cursor-pointer group hover:ring-2 hover:ring-[#fcbf46] transition-all"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleUnlockSignature(ls);
                                    }}
                                  >
                                    <img src={ls.base64} alt="Locked Signature" className="w-full h-auto object-contain pointer-events-none" />
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setLockedSignatures(prev => prev.filter(l => l !== ls));
                                      }}
                                      className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 shadow shadow-rose-900/50 transition-opacity"
                                      title="Hapus"
                                    >
                                      <span className="material-symbols-outlined text-[12px]">close</span>
                                    </button>
                                  </div>
                                );
                              })}

                            {isTarget && signatureImg && (
                              <div
                                style={{ left: pos.x, top: pos.y, width: sigWidth }}
                                className={`absolute z-50 group cursor-move ${isDragging || isResizing ? 'outline outline-2 outline-[#006767] bg-[#006767]/5 shadow-xl' : 'outline outline-2 outline-dashed outline-gray-400 hover:outline-[#006767]/50'} rounded`}
                                onMouseDown={handleMouseDown}
                              >
                                <img src={signatureImg} alt="Signature" className="w-full h-auto object-contain pointer-events-none" />
                                
                                <div className={`absolute -top-3 -left-3 w-6 h-6 bg-[#006767] rounded-full text-white flex items-center justify-center shadow pointer-events-none ${isDragging || isResizing ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}>
                                  <span className="material-symbols-outlined text-[14px]">drag_indicator</span>
                                </div>
                                <div className={`absolute -bottom-3 -right-3 w-6 h-6 bg-[#fcbf46] rounded-full text-[#271900] flex items-center justify-center shadow cursor-se-resize ${isDragging || isResizing ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`} onMouseDown={handleResizeMouseDown}>
                                  <span className="material-symbols-outlined text-[14px]">aspect_ratio</span>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </Document>
                  )}
                </div>
              </div>
            </div>

            {/* RIGHT: Tools */}
            <div className="flex-1 lg:w-2/5 flex flex-col space-y-4">
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#006767]">draw</span>
                  Sumber Tanda Tangan
                </h3>
                
                {!signatureImg ? (
                  <div className="space-y-4">
                    <div className="flex bg-gray-100 p-1 rounded-lg">
                      <button onClick={() => setSignMethod("draw")} className={`flex-1 py-1.5 text-sm font-semibold rounded-md transition-all ${signMethod === "draw" ? "bg-white text-[#006767] shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>Gambar Manual</button>
                      <button onClick={() => setSignMethod("upload")} className={`flex-1 py-1.5 text-sm font-semibold rounded-md transition-all ${signMethod === "upload" ? "bg-white text-[#006767] shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>Unggah (PNG)</button>
                    </div>

                    {(() => {
                      const savedSig = typeof window !== "undefined" ? localStorage.getItem(`signflow_saved_signature_${getCurrentUserId()}`) : null; // Quick sign usually has no fixed user context or assumes 1 for now, but let's import getCurrentUserId
                      return savedSig && !signatureImg ? (
                        <button
                          onClick={() => setSignatureImg(savedSig)}
                          className="w-full mb-2 flex items-center justify-center space-x-2 bg-emerald-50 text-emerald-700 border border-emerald-200 px-4 py-2 rounded-xl font-bold hover:bg-emerald-100 transition-colors text-sm"
                        >
                          <span className="material-symbols-outlined text-[18px]">verified</span>
                          <span>Gunakan TTD Default Tersimpan</span>
                        </button>
                      ) : null;
                    })()}

                    {signMethod === "draw" ? (
                      <>
                        <div className="border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 hover:bg-gray-100 relative">
                          <SignatureCanvas ref={sigCanvasRef} penColor="#000" canvasProps={{ className: "w-full h-40 cursor-crosshair rounded-xl" }} />
                        </div>
                        <div className="flex items-center justify-between">
                          <button onClick={clearCanvas} className="text-xs font-semibold text-gray-500 hover:text-rose-600 px-3 py-2 rounded-lg hover:bg-gray-100">Hapus Coretan</button>
                          <button onClick={saveSignature} className="text-sm font-bold text-white bg-[#006767] hover:bg-[#004f4f] px-5 py-2.5 rounded-xl shadow-sm transition-colors">Gunakan Coretan</button>
                        </div>
                      </>
                    ) : (
                      <div className="border-2 border-dashed border-[#006767]/30 rounded-xl bg-[#f7fffe] p-8 text-center">
                        <span className="material-symbols-outlined text-4xl text-[#006767] mb-2">image</span>
                        <p className="text-sm font-semibold text-gray-900 mb-1">Pilih File Tanda Tangan</p>
                        <p className="text-xs text-gray-500 mb-5">Hanya menerima format .PNG atau .JPG</p>
                        <input type="file" accept="image/png, image/jpeg, image/jpg" className="hidden" ref={fileInputRef} onChange={handleSignatureUpload} />
                        <button onClick={() => fileInputRef.current?.click()} className="text-sm font-bold text-[#006767] bg-white border border-[#006767]/20 shadow-sm hover:bg-gray-50 px-5 py-2.5 rounded-xl transition-colors">Cari File...</button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-5 text-center mb-6">
                    <span className="material-symbols-outlined text-emerald-500 text-3xl mb-2">check_circle</span>
                    <p className="text-sm font-bold text-emerald-800">Tanda Tangan Siap di Halaman {targetPage}!</p>
                    <p className="text-xs text-emerald-600 mt-1">Klik halaman manapun di sebelah kiri jika ingin memindahkannya ke halaman tersebut.</p>
                    <div className="flex items-center justify-center gap-2 mt-4 flex-wrap">
                      <button onClick={() => { setSignatureImg(null); setSignMethod("draw"); }} className="text-xs font-semibold text-rose-600 hover:underline">Ganti Gambar</button>
                      <div className="w-px h-3 bg-emerald-200"></div>
                      <button onClick={() => setSigWidth(30)} className="text-xs font-bold text-emerald-800 bg-emerald-200/50 hover:bg-emerald-200 px-2 py-1 rounded transition-colors flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">straighten</span> Mode Paraf
                      </button>
                      <div className="w-px h-3 bg-emerald-200"></div>
                      <button onClick={() => { 
                        const pageEl = pageRefs.current[targetPage - 1];
                        if(pageEl) {
                          setLockedSignatures(prev => [...prev, {
                            x: pos.x / pageEl.clientWidth,
                            y: pos.y / pageEl.clientHeight,
                            width: sigWidth / pageEl.clientWidth,
                            page: targetPage,
                            base64: signatureImg
                          }]);
                          alert("Posisi ini telah dikunci! Anda kini bebas memindahkan stempel aktif ke tempat lain untuk membubuhkan TTD/Paraf tambahan.");
                        }
                      }} className="text-xs font-bold text-[#006767] bg-white border border-[#006767]/30 hover:bg-[#006767]/10 px-2 py-1 rounded transition-colors flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">add_task</span> Kunci & Tambah Lagi
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 border-l-4 border-l-[#006767]">
                <h3 className="text-base font-bold text-gray-900 mb-2">Finalisasi Dokumen</h3>
                <p className="text-xs text-gray-500 mb-6">Tanda tangan akan distempel secara permanen ke Halaman {targetPage}.</p>
                <button 
                  onClick={handleDownload} disabled={(!signatureImg && lockedSignatures.length === 0) || isProcessing}
                  className="w-full flex items-center justify-center space-x-2 bg-[#006767] text-white px-5 py-4 rounded-xl font-bold shadow-md hover:bg-[#004f4f] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? <span className="animate-spin material-symbols-outlined">sync</span> : <span className="material-symbols-outlined">download</span>}
                  <span>{isProcessing ? "Menyimpan Dokumen..." : "Terapkan Tanda Tangan & Unduh"}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
