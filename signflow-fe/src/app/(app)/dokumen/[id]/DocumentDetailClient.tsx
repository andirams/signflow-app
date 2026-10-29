"use client";

import React, { useRef, useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Header from "@/components/Header";
import { getCurrentUserId } from "@/lib/auth";
import SignatureCanvas from "react-signature-canvas";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// Setup Worker PDF.js
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export default function DocumentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const sigCanvasRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pdfContainerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Workflow States
  const [isSigning, setIsSigning] = useState(false);
  const [signatureImg, setSignatureImg] = useState<string | null>(null);
  const [signMethod, setSignMethod] = useState<"draw" | "upload">("draw");
  const [notes, setNotes] = useState("");
  
  // PDF Rendering States
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [targetPage, setTargetPage] = useState<number>(1);
  const [baseRenderWidth, setBaseRenderWidth] = useState(800);
  const [zoomLevel, setZoomLevel] = useState(1.0);
  const [hasError, setHasError] = useState(false);

  // Drag and Resize States (Percentage Ready)
  const [pos, setPos] = useState({ x: 100, y: 100 });
  const [sigWidth, setSigWidth] = useState(200);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [lockedSignatures, setLockedSignatures] = useState<any[]>([]);
  const dragOffset = useRef({ x: 0, y: 0 });
  const resizeStart = useRef({ x: 0, w: 200 });

  // Document Details State
  const [documentDetails, setDocumentDetails] = useState<any>(null);
  const [approvalSteps, setApprovalSteps] = useState<any[]>([]);

  // 1. Ambil Dokumen Asli dan Detail dari API
  useEffect(() => {
    const documentId = params.id || 1;
    // Menggunakan endpoint download yang baru dibuat
    setPdfUrl(`http://localhost:8080/api/documents/${documentId}/download?t=${new Date().getTime()}`);
    
    // Fetch detail dan alur persetujuan
    fetch(`http://localhost:8080/api/documents/${documentId}?t=${new Date().getTime()}`, { cache: "no-store" })
      .then(res => {
        if (!res.ok) {
          throw new Error("Dokumen tidak ditemukan atau API error");
        }
        return res.json();
      })
      .then(data => {
        if(data && data.document) {
           setDocumentDetails(data.document);
           setApprovalSteps(data.approvalSteps || []);
        }
      })
      .catch(err => {
        console.log("Error fetching document details:", err);
        setHasError(true);
      });

  }, [params.id]);

  // 2. Auto-fit PDF width pada pertama kali render
  useEffect(() => {
    if (pdfContainerRef.current) {
      const available = pdfContainerRef.current.clientWidth - 100;
      if (available > 300) setBaseRenderWidth(available);
    }
  }, [pdfUrl]);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    pageRefs.current = new Array(numPages).fill(null);
  };

  const onDocumentLoadError = () => {
    setHasError(true);
  };

  // 3. Sensor Pendaratan Pintar
  const getVisiblePage = () => {
    let bestPage = 1;
    let maxVisibleArea = 0;
    const container = pdfContainerRef.current;
    if (!container) return 1;

    const containerRect = container.getBoundingClientRect();

    pageRefs.current.forEach((el, index) => {
      if (!el) return;
      const rect = el.getBoundingClientRect();
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

  const centerSignatureSmartly = (pageNumToUse?: number) => {
    const pageNum = pageNumToUse || getVisiblePage();
    setTargetPage(pageNum);
    
    const container = pdfContainerRef.current;
    const pageEl = pageRefs.current[pageNum - 1];
    
    if (container && pageEl) {
      const containerCenterY = container.scrollTop + (container.clientHeight / 2);
      let localY = containerCenterY - pageEl.offsetTop;
      
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
    setPos(prev => ({ x: prev.x * ratio, y: prev.y * ratio }));
    setSigWidth(prev => prev * ratio);
    setZoomLevel(newZoom);
  };

  // --- Handlers for Canvas & Upload ---
  const clearCanvas = () => {
    if (sigCanvasRef.current) sigCanvasRef.current.clear();
  };

  const saveSignature = () => {
    if (sigCanvasRef.current && !sigCanvasRef.current.isEmpty()) {
      const dataURL = sigCanvasRef.current.getTrimmedCanvas().toDataURL("image/png");
      setSignatureImg(dataURL);
      setTimeout(() => centerSignatureSmartly(), 50);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  // --- Submission ke Backend ---
  const handleApprove = async () => {
    if (!signatureImg && lockedSignatures.length === 0) {
      alert("Mohon bubuhkan setidaknya satu tanda tangan/paraf Anda terlebih dahulu sebelum menyetujui.");
      return;
    }
    
    setIsSigning(true);

    try {
      const currentUserId = getCurrentUserId();
      const placements = [...lockedSignatures];
      
      // Tambahkan yang aktif jika ada dan tidak sedang disembunyikan/dikosongkan
      if (signatureImg) {
        const pageEl = pageRefs.current[targetPage - 1];
        if (pageEl) {
          const canvasWidth = pageEl.clientWidth;
          const canvasHeight = pageEl.clientHeight;
          placements.push({
            x: pos.x / canvasWidth,
            y: pos.y / canvasHeight,
            width: sigWidth / canvasWidth,
            page: targetPage
          });
        }
      }

      if (placements.length === 0) {
          alert("Halaman PDF belum termuat sempurna.");
          setIsSigning(false);
          return;
      }

      const response = await fetch(`http://localhost:8080/api/documents/${params.id || 1}/sign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          approverId: currentUserId,
          signatureBase64: signatureImg || lockedSignatures[0]?.base64,
          notes: notes || "Telah disetujui",
          placements: placements
        }),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      // Catat ke Audit Log
      fetch("http://localhost:8080/api/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "APPROVE",
          description: `User menyetujui dokumen #${params.id || 1} dengan stempel digital.`,
          username: documentDetails?.title || "Dokumen"
        })
      }).catch(() => {});

      alert(`Berhasil! Tanda tangan telah distempel presisi pada PDF dan status telah diperbarui.`);
      router.push("/dashboard");
    } catch (error: any) {
      alert("Error: " + error.message);
    } finally {
      setIsSigning(false);
    }
  };

  const handleReject = async () => {
    const reason = window.prompt("Masukkan alasan penolakan dokumen:");
    if (reason === null) return; // User clicked Cancel

    setIsSigning(true);
    try {
      const currentUserId = getCurrentUserId();
      const response = await fetch(`http://localhost:8080/api/documents/${params.id || 1}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          approverId: currentUserId,
          notes: reason || notes || "Ditolak tanpa alasan.",
        }),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      // Catat ke Audit Log
      fetch("http://localhost:8080/api/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "REJECT",
          description: `User menolak dokumen #${params.id || 1}. Alasan: ${reason}`,
          username: documentDetails?.title || "Dokumen"
        })
      }).catch(() => {});

      alert(`Dokumen berhasil ditolak.`);
      router.push("/dashboard");
    } catch (error: any) {
      alert("Error: " + error.message);
    } finally {
      setIsSigning(false);
    }
  };

  // --- Mouse Handlers for Drag & Resize ---
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
        title="Detail & Approval Dokumen"
        breadcrumbs={[
          { label: "SignFlow", href: "/dashboard" },
          { label: "Menunggu Approval", href: "/dashboard" },
          { label: `Dokumen #${params.id || "1"}` },
        ]}
      />

      {(isDragging || isResizing) && <div className="fixed inset-0 z-[9999] cursor-move" />}

      <main className="p-6 max-w-[1600px] mx-auto flex flex-col lg:flex-row gap-6">
        
        {/* LEFT PANEL: Document Viewer */}
        <div className="flex-1 lg:w-3/5 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-[800px]">
          {/* Toolbar Atas PDF */}
          <div className="h-14 bg-gray-50 border-b border-gray-200 flex items-center justify-between px-4 shrink-0 z-10">
            <div className="flex items-center space-x-2">
              <button onClick={() => handleZoom(Math.max(0.5, zoomLevel - 0.2))} className="p-1.5 hover:bg-gray-200 rounded text-gray-600"><span className="material-symbols-outlined text-[20px]">zoom_out</span></button>
              <span className="text-xs font-semibold text-gray-600 w-12 text-center">{Math.round(zoomLevel * 100)}%</span>
              <button onClick={() => handleZoom(Math.min(3.0, zoomLevel + 0.2))} className="p-1.5 hover:bg-gray-200 rounded text-gray-600"><span className="material-symbols-outlined text-[20px]">zoom_in</span></button>
            </div>
            <div className="text-xs font-medium text-gray-500">
              Dokumen: {params.id} | Menampilkan {numPages} Halaman
            </div>
          </div>

          {/* Document Render Area (React-PDF Multi-Page) */}
          <div ref={pdfContainerRef} className="flex-1 bg-gray-300 overflow-auto relative select-none">
            {hasError ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <span className="material-symbols-outlined text-gray-400 text-6xl mb-4">error_outline</span>
                <p className="font-bold text-gray-600">Dokumen PDF tidak ditemukan!</p>
                <p className="text-sm text-gray-500 mt-2">Pastikan file <code>dokumen_asli_{params.id}.pdf</code> ada di direktori root project backend.</p>
              </div>
            ) : (
              <div className="min-w-max p-8 flex flex-col items-center gap-8">
                {pdfUrl && (
                  <Document 
                    file={pdfUrl} 
                    onLoadSuccess={onDocumentLoadSuccess} 
                    onLoadError={onDocumentLoadError}
                    className="flex flex-col items-center gap-8"
                  >
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
            )}
          </div>
        </div>

        {/* RIGHT PANEL: Actions & Signature Pad */}
        <div className="flex-1 lg:w-2/5 flex flex-col space-y-4">
          
          {/* Card 1: Workflow Status */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between border-b pb-4 mb-4">
              <h3 className="text-base font-bold text-gray-900">Status Approval</h3>
              <a 
                href={`http://localhost:8080/api/documents/${params.id || 1}/download`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#006767]/10 text-[#006767] hover:bg-[#006767]/20 rounded-lg text-xs font-bold transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">download</span>
                Unduh PDF
              </a>
            </div>
            <div className="space-y-6">
              {/* Step 1 (Pembuat) */}
              <div className="flex gap-4 relative">
                <div className="w-0.5 h-full bg-[#006767] absolute left-3 top-6"></div>
                <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-sm z-10">
                  <span className="material-symbols-outlined text-[14px]">check</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">
                    Sistem SignFlow <span className="font-normal text-gray-500">(Pembuat)</span>
                  </p>
                  <p className="text-xs text-gray-500">
                    {documentDetails ? new Date(documentDetails.createdAt).toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : "Loading..."}
                  </p>
                </div>
              </div>

              {/* Dynamic Approval Steps */}
              {approvalSteps.map((step: any, index: number) => {
                const isLast = index === approvalSteps.length - 1;
                const isApproved = step.status === "Disetujui";
                const isRejected = step.status === "Ditolak";
                const isWaiting = step.status === "Menunggu";

                let iconColor = "bg-gray-200";
                let iconContent = "";
                let cardClass = "";

                if (isApproved) {
                  iconColor = "bg-emerald-500";
                  iconContent = "check";
                } else if (isRejected) {
                  iconColor = "bg-rose-500";
                  iconContent = "close";
                } else if (isWaiting) {
                  iconColor = "bg-[#fcbf46] ring-4 ring-[#fcbf46]/20 animate-pulse";
                  cardClass = "bg-amber-50 border border-amber-100 rounded-xl p-3 w-full";
                }

                return (
                  <div key={step.id} className="flex gap-4 relative">
                    {!isLast && <div className={`w-0.5 h-full absolute left-3 top-6 ${isApproved ? 'bg-[#006767]' : 'bg-gray-200'}`}></div>}
                    <div className={`w-6 h-6 rounded-full text-white flex items-center justify-center shrink-0 shadow-sm z-10 ${iconColor}`}>
                      {iconContent && <span className="material-symbols-outlined text-[14px]">{iconContent}</span>}
                    </div>
                    <div className={cardClass || "w-full"}>
                      <p className="text-sm font-bold text-gray-900">
                        {step.approver.name || `Approver ID ${step.approver.id}`}
                        {isWaiting && (
                          <span className="font-normal text-amber-700 bg-amber-200/50 px-2 py-0.5 rounded text-[10px] ml-1">
                            MENUNGGU
                          </span>
                        )}
                        {isApproved && (
                          <span className="font-normal text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded text-[10px] ml-1">
                            DISETUJUI
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {step.approver.department || "Unit Kerja"}
                      </p>
                      {step.actionDate && (
                        <p className="text-[10px] text-gray-400 mt-1">
                          {new Date(step.actionDate).toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      )}
                      {step.comments && (
                        <p className="text-xs text-gray-600 bg-white border border-gray-200 rounded p-2 mt-2">
                          <span className="font-semibold">Catatan:</span> {step.comments}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Card 2: Signature Action */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 border-l-4 border-l-[#fcbf46]">
            <h3 className="text-base font-bold text-gray-900 mb-2">Tindakan Anda</h3>
            <p className="text-xs text-gray-500 mb-4">Pilih sumber tanda tangan Anda, lalu atur pada Halaman {targetPage}.</p>

            {/* Canvas / Upload Area */}
            {!signatureImg ? (
              <div className="space-y-4">
                {/* Tabs */}
                <div className="flex bg-gray-100 p-1 rounded-xl mb-4">
                  <button
                    onClick={() => setSignMethod("draw")}
                    className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${signMethod === "draw" ? "bg-white text-[#006767] shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                  >
                    Gambar Manual
                  </button>
                  <button
                    onClick={() => setSignMethod("upload")}
                    className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${signMethod === "upload" ? "bg-white text-[#006767] shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                  >
                    Unggah (PNG)
                  </button>
                </div>

                {/* NEW: Use Saved Signature Button */}
                {(() => {
                  const currentId = getCurrentUserId();
                  const savedSig = typeof window !== "undefined" ? localStorage.getItem(`signflow_saved_signature_${currentId}`) : null;
                  return savedSig && !signatureImg ? (
                    <button
                      onClick={() => setSignatureImg(savedSig)}
                      className="w-full mb-4 flex items-center justify-center space-x-2 bg-emerald-50 text-emerald-700 border border-emerald-200 px-4 py-2 rounded-xl font-bold hover:bg-emerald-100 transition-colors text-sm"
                    >
                      <span className="material-symbols-outlined text-[18px]">verified</span>
                      <span>Gunakan TTD Default Tersimpan</span>
                    </button>
                  ) : null;
                })()}

                {/* Content based on selected tab */}
                {signMethod === "draw" ? (
                  <>
                    <div className="border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors relative">
                      <SignatureCanvas 
                        ref={sigCanvasRef}
                        penColor="#0f172a"
                        canvasProps={{ className: "w-full h-40 cursor-crosshair rounded-xl" }}
                      />
                      <div className="absolute top-2 left-2 text-xs text-gray-400 font-medium pointer-events-none flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">draw</span> Gambar di sini
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <button onClick={clearCanvas} className="text-xs font-semibold text-gray-500 hover:text-rose-600 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                        Hapus Ulang
                      </button>
                      <button onClick={saveSignature} className="text-xs font-bold text-white bg-[#006767] hover:bg-[#004f4f] px-4 py-2 rounded-lg shadow-sm transition-colors">
                        Gunakan Coretan
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="border-2 border-dashed border-[#006767]/30 rounded-xl bg-[#f7fffe] p-6 text-center">
                    <span className="material-symbols-outlined text-4xl text-[#006767] mb-2">image</span>
                    <p className="text-sm font-semibold text-gray-900 mb-1">Pilih File Tanda Tangan</p>
                    <p className="text-xs text-gray-500 mb-4">Hanya menerima format .PNG atau .JPG</p>
                    
                    <input 
                      type="file" 
                      accept="image/png, image/jpeg, image/jpg" 
                      className="hidden" 
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                    />
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="text-sm font-bold text-[#006767] bg-white border border-[#006767]/20 shadow-sm hover:bg-gray-50 px-5 py-2.5 rounded-xl transition-colors"
                    >
                      Cari File...
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 text-center">
                <span className="material-symbols-outlined text-emerald-500 text-3xl mb-2">task_alt</span>
                <p className="text-sm font-bold text-emerald-800">Tanda Tangan Siap di Halaman {targetPage}!</p>
                <p className="text-xs text-emerald-600 mt-1">Sesuaikan posisi dan ukurannya pada dokumen di sebelah kiri.</p>
                <div className="flex items-center justify-center gap-2 mt-4 flex-wrap">
                  <button onClick={() => { setSignatureImg(null); setSignMethod("draw"); }} className="text-xs font-semibold text-rose-600 hover:underline">
                    Ganti Gambar
                  </button>
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

            <div className="mt-6 space-y-3">
              <label className="block text-xs font-semibold text-gray-700">Catatan (Opsional)</label>
              <textarea 
                className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#006767]" 
                rows={2} 
                placeholder="Tambahkan catatan persetujuan jika ada..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              ></textarea>
            </div>

            <div className="mt-6 flex flex-col gap-3">
              <button 
                onClick={handleApprove}
                disabled={isSigning || !signatureImg || hasError}
                className="w-full flex items-center justify-center space-x-2 bg-[#006767] text-white px-5 py-3.5 rounded-xl font-bold shadow-md hover:bg-[#004f4f] transition-colors disabled:opacity-50"
              >
                {isSigning ? (
                  <span className="animate-spin material-symbols-outlined">sync</span>
                ) : (
                  <span className="material-symbols-outlined text-[20px]">verified</span>
                )}
                <span>{isSigning ? "Memproses Stempel PDF..." : "Setujui & Stempel Tanda Tangan"}</span>
              </button>
              <button 
                onClick={handleReject}
                disabled={isSigning}
                className="w-full flex items-center justify-center space-x-2 border border-rose-200 text-rose-600 bg-white px-5 py-3 rounded-xl font-bold hover:bg-rose-50 transition-colors disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
                <span>Tolak Dokumen</span>
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
