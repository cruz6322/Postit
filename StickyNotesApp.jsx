import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Plus,
  Trash2,
  X,
  Pin,
  ExternalLink,
  Image as ImageIcon,
  Paperclip,
  Palette,
  Type,
  Link as LinkIcon,
  Download,
  Search,
  Grid,
  ChevronDown,
  ChevronUp,
  FileText,
  Save,
  Upload,
  Sparkles
} from 'lucide-react';

// --- 파스텔 색상 테마 팔레트 정의 (7종) ---
export const PASTEL_THEMES = [
  { id: 'yellow', name: '레몬 옐로우', bg: 'bg-yellow-100', headerBg: 'bg-yellow-200', border: 'border-yellow-300', text: 'text-amber-950', dot: '#fef08a' },
  { id: 'pink', name: '베이비 핑크', bg: 'bg-pink-100', headerBg: 'bg-pink-200', border: 'border-pink-300', text: 'text-pink-950', dot: '#fbcfe8' },
  { id: 'green', name: '프레시 민트', bg: 'bg-emerald-100', headerBg: 'bg-emerald-200', border: 'border-emerald-300', text: 'text-emerald-950', dot: '#a7f3d0' },
  { id: 'blue', name: '스카이 블루', bg: 'bg-sky-100', headerBg: 'bg-sky-200', border: 'border-sky-300', text: 'text-sky-950', dot: '#bae6fd' },
  { id: 'orange', name: '소프트 오렌지', bg: 'bg-orange-100', headerBg: 'bg-orange-200', border: 'border-orange-300', text: 'text-orange-950', dot: '#fed7aa' },
  { id: 'purple', name: '라벤더 퍼플', bg: 'bg-purple-100', headerBg: 'bg-purple-200', border: 'border-purple-300', text: 'text-purple-950', dot: '#e9d5ff' },
  { id: 'white', name: '클라우드 화이트', bg: 'bg-slate-50', headerBg: 'bg-slate-200', border: 'border-slate-300', text: 'text-slate-900', dot: '#f1f5f9' },
];

// --- 폰트 및 폰트 크기 옵션 ---
export const FONT_FAMILIES = [
  { id: 'sans', name: '기본 고딕 (Sans)', className: 'font-sans' },
  { id: 'handwriting', name: '손글씨 (Cursive)', className: 'font-handwriting font-serif italic' },
  { id: 'serif', name: '명조체 (Serif)', className: 'font-serif' },
  { id: 'mono', name: '코딩체 (Mono)', className: 'font-mono' },
];

export const FONT_SIZES = [
  { id: 'sm', name: '작게', className: 'text-sm' },
  { id: 'base', name: '보통', className: 'text-base' },
  { id: 'lg', name: '크게', className: 'text-lg' },
];

// --- 기본 초기 메모 데이터 ---
const INITIAL_NOTES = [
  {
    id: 'welcome-note-1',
    title: '📌 윈도우 스티커 메모 시작하기',
    content: `환영합니다! 윈도우 데스크톱 스타일의 인터랙티브 포스트잇입니다.\n\n✨ 주요 기능 안내:\n• 상단 헤더 바를 마우스로 잡고 자유롭게 이동할 수 있습니다.\n• 메모를 클릭하면 최상단(Z-Index)으로 올라옵니다.\n• 하단 툴바에서 파스텔 색상, 폰트, 크기를 변경해보세요!\n• 사진과 파일을 메모 위로 드래그 앤 드롭할 수도 있습니다.`,
    themeId: 'yellow',
    fontFamily: 'sans',
    fontSize: 'base',
    x: 80,
    y: 100,
    width: 330,
    height: 380,
    zIndex: 10,
    isPinned: false,
    isCollapsed: false,
    links: [
      { id: 'l1', title: 'Google 포털', url: 'https://www.google.com' },
      { id: 'l2', title: 'GitHub 저장소', url: 'https://github.com' }
    ],
    images: [],
    files: [],
    createdAt: new Date().toISOString()
  },
  {
    id: 'welcome-note-2',
    title: '💡 링크 및 첨부 기능 테스트',
    content: 'URL을 등록하거나 사진/파일을 첨부하여 데스크톱 작업 환경을 깔끔하게 정리해보세요.\n\n외부 링크는 클릭 시 새 탭에서 즉시 열립니다.',
    themeId: 'blue',
    fontFamily: 'sans',
    fontSize: 'base',
    x: 450,
    y: 120,
    width: 320,
    height: 350,
    zIndex: 11,
    isPinned: false,
    isCollapsed: false,
    links: [
      { id: 'l3', title: '네이버 포털', url: 'https://www.naver.com' }
    ],
    images: [],
    files: [],
    createdAt: new Date().toISOString()
  }
];

// 이미지 압축 헬퍼 (로컬스토리지 5MB 한도 보호를 위해 900px 이하로 최적화)
function compressImageFile(file, maxWidth = 900, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
}

// 파일 크기 포맷팅
function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

// --- 개별 포스트잇 카드 컴포넌트 ---
export function StickyNoteCard({
  note,
  onUpdate,
  onDelete,
  onBringToFront,
  onAddRelativeNote,
  onOpenLightbox
}) {
  const cardRef = useRef(null);
  const isDraggingRef = useRef(false);
  const dragStartOffsetRef = useRef({ x: 0, y: 0 });

  // 마우스 드래그 크기 조절 (Resize) ref
  const isResizingRef = useRef(false);
  const resizeStartRef = useRef({ startX: 0, startY: 0, startWidth: 330, startHeight: 340 });

  // 마우스 우클릭 컨텍스트 메뉴 상태
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0 });

  const [showPalette, setShowPalette] = useState(false);
  const [showFontMenu, setShowFontMenu] = useState(false);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [newLinkTitle, setNewLinkTitle] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);

  const currentTheme = PASTEL_THEMES.find(t => t.id === note.themeId) || PASTEL_THEMES[0];
  const currentFont = FONT_FAMILIES.find(f => f.id === note.fontFamily) || FONT_FAMILIES[0];
  const currentSize = FONT_SIZES.find(s => s.id === note.fontSize) || FONT_SIZES[1];

  // 외부 클릭 시 우클릭 컨텍스트 메뉴 닫기
  useEffect(() => {
    const handleCloseMenu = () => {
      setContextMenu(prev => prev.visible ? { ...prev, visible: false } : prev);
    };
    if (contextMenu.visible) {
      window.addEventListener('click', handleCloseMenu);
      window.addEventListener('contextmenu', handleCloseMenu);
    }
    return () => {
      window.removeEventListener('click', handleCloseMenu);
      window.removeEventListener('contextmenu', handleCloseMenu);
    };
  }, [contextMenu.visible]);

  // 1) 마우스 우측 버튼 클릭 이벤트 핸들러 (컨텍스트 메뉴)
  const handleContextMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onBringToFront(note.id);
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY
    });
  };

  // 드래그 시작 이벤트 핸들러
  const handleMouseDownHeader = (e) => {
    if (e.target.closest('button') || e.target.closest('input')) return;

    onBringToFront(note.id);
    isDraggingRef.current = true;
    dragStartOffsetRef.current = {
      x: e.clientX - note.x,
      y: e.clientY - note.y
    };

    const handleMouseMove = (moveEvent) => {
      if (!isDraggingRef.current) return;
      const newX = Math.max(10, Math.min(window.innerWidth - 80, moveEvent.clientX - dragStartOffsetRef.current.x));
      const newY = Math.max(60, Math.min(window.innerHeight - 80, moveEvent.clientY - dragStartOffsetRef.current.y));
      
      onUpdate(note.id, { x: newX, y: newY });
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // 2) 마우스 드래그로 크기 조절 시작 핸들러
  const handleMouseDownResize = (e) => {
    e.stopPropagation();
    e.preventDefault();
    onBringToFront(note.id);

    isResizingRef.current = true;
    resizeStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startWidth: note.width || 330,
      startHeight: note.height || 340,
    };

    const handleMouseMove = (moveEvent) => {
      if (!isResizingRef.current) return;
      const deltaX = moveEvent.clientX - resizeStartRef.current.startX;
      const deltaY = moveEvent.clientY - resizeStartRef.current.startY;
      const newWidth = Math.max(250, Math.min(900, resizeStartRef.current.startWidth + deltaX));
      const newHeight = Math.max(180, Math.min(1000, resizeStartRef.current.startHeight + deltaY));
      onUpdate(note.id, { width: newWidth, height: newHeight });
    };

    const handleMouseUp = () => {
      isResizingRef.current = false;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // 드래그 앤 드롭 파일/이미지 업로드
  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;
    await processUploadedFiles(files);
  };

  const processUploadedFiles = async (files) => {
    const newImages = [...(note.images || [])];
    const newFiles = [...(note.files || [])];

    for (const file of files) {
      if (file.type.startsWith('image/')) {
        try {
          const base64 = await compressImageFile(file);
          newImages.push({
            id: 'img_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
            name: file.name,
            url: base64
          });
        } catch (err) {
          console.error('이미지 업로드 오류:', err);
        }
      } else {
        const reader = new FileReader();
        reader.onload = (ev) => {
          newFiles.push({
            id: 'file_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
            name: file.name,
            size: file.size,
            type: file.type,
            url: ev.target.result
          });
          onUpdate(note.id, { files: [...newFiles] });
        };
        reader.readAsDataURL(file);
      }
    }

    onUpdate(note.id, { images: newImages, files: newFiles });
  };

  // 외부 링크 등록
  const handleAddLink = (e) => {
    e.preventDefault();
    if (!newLinkUrl.trim()) return;

    let formattedUrl = newLinkUrl.trim();
    if (!/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = 'https://' + formattedUrl;
    }

    const title = newLinkTitle.trim() || formattedUrl.replace(/^https?:\/\//i, '').split('/')[0];
    const updatedLinks = [
      ...(note.links || []),
      {
        id: 'link_' + Date.now(),
        title: title,
        url: formattedUrl
      }
    ];

    onUpdate(note.id, { links: updatedLinks });
    setNewLinkUrl('');
    setNewLinkTitle('');
    setShowLinkInput(false);
  };

  return (
    <div
      ref={cardRef}
      onClick={() => onBringToFront(note.id)}
      onContextMenu={handleContextMenu}
      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
      style={{
        transform: `translate3d(${note.x}px, ${note.y}px, 0)`,
        width: `${note.width || 330}px`,
        height: note.isCollapsed ? 'auto' : `${note.height || 340}px`,
        zIndex: note.zIndex || 1,
        position: 'absolute',
        top: 0,
        left: 0,
      }}
      className={`flex flex-col rounded-xl overflow-hidden border transition-shadow duration-150 ${currentTheme.border} ${currentTheme.bg} ${
        isDragOver ? 'ring-4 ring-blue-400 ring-opacity-60 scale-[1.01]' : 'shadow-lg hover:shadow-2xl'
      }`}
    >
      {/* 카드 상단 드래그 헤더 바 */}
      <div
        onMouseDown={handleMouseDownHeader}
        className={`flex items-center justify-between px-3 py-2 cursor-grab active:cursor-grabbing border-b ${currentTheme.border} ${currentTheme.headerBg} select-none shrink-0`}
      >
        <div className="flex items-center space-x-1.5">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onAddRelativeNote(note.x + 30, note.y + 30); }}
            title="새 스티커 메모 추가"
            className="p-1 rounded-md hover:bg-black/10 transition-colors text-slate-700 hover:text-slate-950"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onUpdate(note.id, { isPinned: !note.isPinned }); }}
            title={note.isPinned ? "상단 고정 해제" : "상단 핀 고정"}
            className={`p-1 rounded-md transition-colors ${note.isPinned ? 'text-blue-700 bg-blue-200/60' : 'text-slate-600 hover:bg-black/10'}`}
          >
            <Pin className={`w-4 h-4 ${note.isPinned ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* 인라인 제목 수정 */}
        <input
          type="text"
          value={note.title || ''}
          onChange={(e) => onUpdate(note.id, { title: e.target.value })}
          placeholder="제목 없음"
          className={`bg-transparent text-sm font-semibold tracking-tight text-center px-2 py-0.5 focus:outline-none focus:bg-white/40 rounded transition-all flex-1 truncate mx-1 ${currentTheme.text}`}
        />

        {/* 접기 / 닫기 */}
        <div className="flex items-center space-x-1">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onUpdate(note.id, { isCollapsed: !note.isCollapsed }); }}
            title={note.isCollapsed ? "메모 펼치기" : "메모 접기"}
            className="p-1 rounded-md hover:bg-black/10 transition-colors text-slate-700"
          >
            {note.isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (window.confirm('이 메모를 삭제하시겠습니까?')) {
                onDelete(note.id);
              }
            }}
            title="메모 삭제"
            className="p-1 rounded-md hover:bg-rose-500 hover:text-white transition-colors text-slate-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 본문 콘텐츠 */}
      {!note.isCollapsed && (
        <div className="flex flex-col flex-1 p-3 min-h-0 overflow-hidden relative">
          <textarea
            value={note.content}
            onChange={(e) => onUpdate(note.id, { content: e.target.value })}
            placeholder="여기에 메모를 입력하세요... (클릭하여 편집, 우클릭 시 삭제 메뉴)"
            className={`w-full flex-1 min-h-[70px] bg-transparent resize-none focus:outline-none placeholder-slate-400 select-text ${currentFont.className} ${currentSize.className} ${currentTheme.text}`}
          />

          {/* 스크롤 가능한 부가 콘텐츠 영역 (링크 / 사진 / 파일) */}
          <div className="overflow-y-auto max-h-[160px] pr-0.5 space-y-2">
            {/* 외부 링크 목록 */}
            {note.links && note.links.length > 0 && (
              <div className="pt-2 border-t border-black/10 space-y-1">
                <div className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                  <LinkIcon className="w-3 h-3" /> 바로가기 링크 ({note.links.length})
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {note.links.map(link => (
                    <div
                      key={link.id}
                      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs bg-white/70 hover:bg-white text-blue-700 shadow-sm border border-blue-200/60 transition-colors"
                    >
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={link.url}
                        className="flex items-center gap-1 hover:underline truncate max-w-[170px]"
                      >
                        <ExternalLink className="w-3 h-3 shrink-0" />
                        <span className="truncate">{link.title}</span>
                      </a>
                      <button
                        type="button"
                        onClick={() => onUpdate(note.id, { links: note.links.filter(l => l.id !== link.id) })}
                        className="text-slate-400 hover:text-rose-500"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 이미지 썸네일 미리보기 */}
            {note.images && note.images.length > 0 && (
              <div className="pt-2 border-t border-black/10">
                <div className="text-[11px] font-semibold text-slate-500 mb-1.5 flex items-center gap-1">
                  <ImageIcon className="w-3 h-3" /> 첨부된 사진 ({note.images.length})
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {note.images.map(img => (
                    <div
                      key={img.id}
                      className="relative group rounded-lg overflow-hidden aspect-video bg-black/5 border border-black/10 cursor-pointer shadow-sm"
                      onClick={() => onOpenLightbox(img.url, img.name)}
                    >
                      <img src={img.url} alt={img.name} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onUpdate(note.id, { images: note.images.filter(i => i.id !== img.id) });
                        }}
                        title="이미지 삭제"
                        className="absolute top-1 right-1 p-1 bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 hover:bg-rose-600 transition-all"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 로컬 파일 첨부 목록 */}
            {note.files && note.files.length > 0 && (
              <div className="pt-2 border-t border-black/10 space-y-1">
                <div className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                  <Paperclip className="w-3 h-3" /> 첨부 파일 ({note.files.length})
                </div>
                <div className="space-y-1">
                  {note.files.map(file => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between px-2 py-1 rounded bg-white/60 hover:bg-white/90 border border-black/10 text-xs shadow-sm transition-colors"
                    >
                      <div className="flex items-center gap-1.5 min-w-0 flex-1 mr-2">
                        <FileText className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                        <span className="truncate font-medium text-slate-800" title={file.name}>{file.name}</span>
                        <span className="text-[10px] text-slate-400 shrink-0">({formatFileSize(file.size)})</span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <a
                          href={file.url}
                          download={file.name}
                          title="다운로드"
                          className="p-1 hover:bg-blue-100 text-blue-600 rounded transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>
                        <button
                          type="button"
                          onClick={() => onUpdate(note.id, { files: note.files.filter(f => f.id !== file.id) })}
                          title="파일 제거"
                          className="p-1 hover:bg-rose-100 text-rose-500 rounded transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 외부 링크 추가 모달 */}
            {showLinkInput && (
              <form onSubmit={handleAddLink} className="p-2 bg-white/95 rounded-lg border border-slate-300 shadow-md space-y-1.5 text-xs">
                <div className="font-semibold text-slate-700 flex justify-between items-center">
                  <span>외부 웹사이트 링크 추가</span>
                  <button type="button" onClick={() => setShowLinkInput(false)} className="text-slate-400 hover:text-slate-700">
                    <X className="w-3 h-3" />
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="https://example.com"
                  value={newLinkUrl}
                  onChange={(e) => setNewLinkUrl(e.target.value)}
                  className="w-full px-2 py-1 border border-slate-300 rounded focus:outline-none focus:border-blue-500"
                  autoFocus
                />
                <input
                  type="text"
                  placeholder="링크 이름 (선택)"
                  value={newLinkTitle}
                  onChange={(e) => setNewLinkTitle(e.target.value)}
                  className="w-full px-2 py-1 border border-slate-300 rounded focus:outline-none focus:border-blue-500"
                />
                <div className="flex justify-end gap-1 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowLinkInput(false)}
                    className="px-2 py-0.5 rounded text-slate-600 hover:bg-slate-200"
                  >
                    취소
                  </button>
                  <button type="submit" className="px-2.5 py-0.5 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium">
                    추가
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* 하단 커스터마이징 툴바 */}
          <div className="mt-2 pt-2 border-t border-black/10 flex items-center justify-between text-slate-600 relative shrink-0">
            <div className="flex items-center space-x-1">
              {/* 색상 팔레트 */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => { setShowPalette(!showPalette); setShowFontMenu(false); }}
                  title="배경색 변경"
                  className="p-1 rounded hover:bg-black/10 transition-colors"
                >
                  <Palette className="w-4 h-4" />
                </button>
                {showPalette && (
                  <div className="absolute left-0 bottom-8 p-1.5 bg-white/95 rounded-xl shadow-xl border border-slate-200 flex gap-1 z-30">
                    {PASTEL_THEMES.map(theme => (
                      <button
                        key={theme.id}
                        type="button"
                        onClick={() => { onUpdate(note.id, { themeId: theme.id }); setShowPalette(false); }}
                        style={{ backgroundColor: theme.dot }}
                        title={theme.name}
                        className={`w-6 h-6 rounded-full border border-black/20 hover:scale-110 transition-transform ${note.themeId === theme.id ? 'ring-2 ring-blue-500 ring-offset-1' : ''}`}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* 폰트 및 크기 */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => { setShowFontMenu(!showFontMenu); setShowPalette(false); }}
                  title="글꼴 및 크기"
                  className="p-1 rounded hover:bg-black/10 transition-colors"
                >
                  <Type className="w-4 h-4" />
                </button>
                {showFontMenu && (
                  <div className="absolute left-0 bottom-8 p-2 bg-white/95 rounded-xl shadow-xl border border-slate-200 w-44 z-30 text-xs space-y-2 text-slate-800">
                    <div>
                      <div className="font-semibold text-slate-500 mb-1">글꼴 선택</div>
                      <div className="space-y-0.5">
                        {FONT_FAMILIES.map(font => (
                          <button
                            key={font.id}
                            type="button"
                            onClick={() => { onUpdate(note.id, { fontFamily: font.id }); setShowFontMenu(false); }}
                            className={`w-full text-left px-2 py-1 rounded hover:bg-blue-50 flex items-center justify-between ${font.className} ${note.fontFamily === font.id ? 'bg-blue-100 text-blue-800 font-bold' : ''}`}
                          >
                            <span>{font.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="pt-1.5 border-t border-slate-200">
                      <div className="font-semibold text-slate-500 mb-1">글자 크기</div>
                      <div className="flex gap-1">
                        {FONT_SIZES.map(sz => (
                          <button
                            key={sz.id}
                            type="button"
                            onClick={() => onUpdate(note.id, { fontSize: sz.id })}
                            className={`flex-1 py-0.5 text-center rounded border ${note.fontSize === sz.id ? 'bg-blue-600 text-white border-blue-600' : 'hover:bg-slate-100 border-slate-200'}`}
                          >
                            {sz.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 링크 추가 */}
              <button
                type="button"
                onClick={() => { setShowLinkInput(!showLinkInput); setShowPalette(false); setShowFontMenu(false); }}
                title="웹 링크 추가"
                className={`p-1 rounded transition-colors ${showLinkInput ? 'bg-blue-200 text-blue-700' : 'hover:bg-black/10'}`}
              >
                <LinkIcon className="w-4 h-4" />
              </button>

              {/* 이미지 첨부 */}
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                title="사진 첨부"
                className="p-1 rounded hover:bg-black/10 transition-colors"
              >
                <ImageIcon className="w-4 h-4" />
              </button>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  if (e.target.files) processUploadedFiles(Array.from(e.target.files));
                }}
              />

              {/* 파일 첨부 */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="파일 첨부"
                className="p-1 rounded hover:bg-black/10 transition-colors"
              >
                <Paperclip className="w-4 h-4" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(e) => {
                  if (e.target.files) processUploadedFiles(Array.from(e.target.files));
                }}
              />
            </div>

            <div className="flex items-center gap-1.5 text-[10px] text-slate-500 opacity-75">
              <span title="우클릭 시 메뉴 표시">우클릭:메뉴</span>
              <span>•</span>
              <span>{note.createdAt ? new Date(note.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
            </div>
          </div>

          {/* 2) 크기 조절 리사이즈 핸들 (우측 하단 코너 마우스 드래깅) */}
          <div
            onMouseDown={handleMouseDownResize}
            title="드래그하여 메모 크기 조절"
            className="absolute bottom-0 right-0 w-6 h-6 cursor-se-resize flex items-end justify-end p-1 text-slate-400 hover:text-slate-800 transition-colors z-20 group"
          >
            <svg viewBox="0 0 10 10" className="w-2.5 h-2.5 fill-current opacity-40 group-hover:opacity-90">
              <circle cx="8" cy="8" r="1.2" />
              <circle cx="4" cy="8" r="1.2" />
              <circle cx="8" cy="4" r="1.2" />
            </svg>
          </div>
        </div>
      )}

      {/* 1) 마우스 우클릭 시 표시되는 컨텍스트 메뉴 (메모 삭제 기능 포함) */}
      {contextMenu.visible && (
        <div
          style={{
            position: 'fixed',
            left: Math.min(contextMenu.x, window.innerWidth - 180),
            top: Math.min(contextMenu.y, window.innerHeight - 220),
            zIndex: 99999,
          }}
          onClick={(e) => e.stopPropagation()}
          className="w-44 bg-white/95 backdrop-blur-md rounded-xl shadow-2xl border border-slate-200 py-1 text-xs text-slate-700 select-none animate-in fade-in zoom-in-95 duration-100"
        >
          <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 border-b border-slate-100 flex items-center justify-between">
            <span>메모 옵션</span>
            <span className="text-[10px] text-slate-400">포스트잇</span>
          </div>

          {/* [요구사항 1] 메모 삭제 버튼 */}
          <button
            type="button"
            onClick={() => {
              setContextMenu({ visible: false, x: 0, y: 0 });
              if (window.confirm('이 메모를 삭제하시겠습니까?')) {
                onDelete(note.id);
              }
            }}
            className="w-full px-3 py-2 text-left hover:bg-rose-50 text-rose-600 font-semibold flex items-center gap-2 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-500" />
            <span>메모 삭제</span>
          </button>

          <div className="my-1 border-t border-slate-100"></div>

          {/* 새 메모 추가 */}
          <button
            type="button"
            onClick={() => {
              setContextMenu({ visible: false, x: 0, y: 0 });
              onAddRelativeNote(note.x + 30, note.y + 30);
            }}
            className="w-full px-3 py-1.5 text-left hover:bg-slate-100 flex items-center gap-2 transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-slate-500" />
            <span>새 메모 추가</span>
          </button>

          {/* 상단 핀 고정 토글 */}
          <button
            type="button"
            onClick={() => {
              setContextMenu({ visible: false, x: 0, y: 0 });
              onUpdate(note.id, { isPinned: !note.isPinned });
            }}
            className="w-full px-3 py-1.5 text-left hover:bg-slate-100 flex items-center gap-2 transition-colors"
          >
            <Pin className={`w-3.5 h-3.5 text-slate-500 ${note.isPinned ? 'fill-current' : ''}`} />
            <span>{note.isPinned ? '상단 핀 해제' : '상단 핀 고정'}</span>
          </button>

          {/* 접기 / 펼치기 */}
          <button
            type="button"
            onClick={() => {
              setContextMenu({ visible: false, x: 0, y: 0 });
              onUpdate(note.id, { isCollapsed: !note.isCollapsed });
            }}
            className="w-full px-3 py-1.5 text-left hover:bg-slate-100 flex items-center gap-2 transition-colors"
          >
            {note.isCollapsed ? <ChevronDown className="w-3.5 h-3.5 text-slate-500" /> : <ChevronUp className="w-3.5 h-3.5 text-slate-500" />}
            <span>{note.isCollapsed ? '메모 펼치기' : '메모 접기'}</span>
          </button>

          <div className="my-1 border-t border-slate-100"></div>

          {/* 빠른 배경색 변경 */}
          <div className="px-3 py-1.5">
            <span className="text-[10px] text-slate-400 block mb-1">배경색 변경</span>
            <div className="flex gap-1">
              {PASTEL_THEMES.map(theme => (
                <button
                  key={theme.id}
                  type="button"
                  style={{ backgroundColor: theme.dot }}
                  title={theme.name}
                  onClick={() => {
                    onUpdate(note.id, { themeId: theme.id });
                    setContextMenu({ visible: false, x: 0, y: 0 });
                  }}
                  className={`w-4 h-4 rounded-full border border-black/20 hover:scale-125 transition-transform ${note.themeId === theme.id ? 'ring-1 ring-blue-500' : ''}`}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- 최상위 React 메인 컴포넌트 ---
export default function StickyNotesApp() {
  const [notes, setNotes] = useState(() => {
    try {
      const saved = localStorage.getItem('postit_notes_desktop_v1');
      return saved ? JSON.parse(saved) : INITIAL_NOTES;
    } catch (e) {
      console.error('로컬스토리지 불러오기 실패:', e);
      return INITIAL_NOTES;
    }
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [maxZIndex, setMaxZIndex] = useState(20);
  const [lightboxImage, setLightboxImage] = useState(null);
  const [toastMsg, setToastMsg] = useState(null);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  useEffect(() => {
    try {
      localStorage.setItem('postit_notes_desktop_v1', JSON.stringify(notes));
    } catch (e) {
      console.error('로컬스토리지 에러:', e);
      showToast('⚠️ 로컬스토리지 용량이 초과되어 저장이 제한될 수 있습니다.');
    }
  }, [notes]);

  const handleBringToFront = useCallback((id) => {
    setMaxZIndex(prev => {
      const nextZ = prev + 1;
      setNotes(curr => curr.map(n => n.id === id ? { ...n, zIndex: nextZ } : n));
      return nextZ;
    });
  }, []);

  const handleAddNote = (customX, customY) => {
    const randomTheme = PASTEL_THEMES[Math.floor(Math.random() * PASTEL_THEMES.length)].id;
    const newX = customX !== undefined ? customX : Math.floor(Math.random() * (window.innerWidth - 400)) + 60;
    const newY = customY !== undefined ? customY : Math.floor(Math.random() * (window.innerHeight - 450)) + 80;

    const newNote = {
      id: 'note_' + Date.now(),
      title: '새 메모',
      content: '',
      themeId: randomTheme,
      fontFamily: 'sans',
      fontSize: 'base',
      x: Math.max(20, newX),
      y: Math.max(70, newY),
      width: 330,
      height: 330,
      zIndex: maxZIndex + 1,
      isPinned: false,
      isCollapsed: false,
      links: [],
      images: [],
      files: [],
      createdAt: new Date().toISOString()
    };

    setMaxZIndex(prev => prev + 1);
    setNotes(prev => [newNote, ...prev]);
    showToast('새 포스트잇이 생성되었습니다 📝');
  };

  const handleUpdateNote = useCallback((id, updates) => {
    setNotes(curr => curr.map(n => (n.id === id ? { ...n, ...updates } : n)));
  }, []);

  const handleDeleteNote = useCallback((id) => {
    setNotes(curr => curr.filter(n => n.id !== id));
    showToast('메모가 삭제되었습니다 🗑️');
  }, []);

  const handleAlignNotes = () => {
    const startX = 60;
    const startY = 80;
    const gapX = 350;
    const gapY = 380;
    const cols = Math.max(1, Math.floor((window.innerWidth - 100) / gapX));

    setNotes(curr => curr.map((note, idx) => {
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      return {
        ...note,
        x: startX + col * gapX,
        y: startY + row * gapY,
      };
    }));
    showToast('포스트잇이 데스크톱에 깔끔하게 정렬되었습니다 ✨');
  };

  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(notes, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `sticky_notes_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('메모 데이터가 JSON 파일로 백업되었습니다 💾');
  };

  const handleImportJSON = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result);
        if (Array.isArray(imported)) {
          setNotes(imported);
          showToast('메모 데이터를 성공적으로 복원했습니다! 🎉');
        } else {
          alert('올바른 메모 JSON 데이터 형식이 아닙니다.');
        }
      } catch (err) {
        alert('파일을 읽는 도중 오류가 발생했습니다.');
      }
    };
    reader.readAsText(file);
  };

  const filteredNotes = useMemo(() => {
    if (!searchQuery.trim()) return notes;
    const query = searchQuery.toLowerCase();
    return notes.filter(n => 
      (n.title && n.title.toLowerCase().includes(query)) ||
      (n.content && n.content.toLowerCase().includes(query)) ||
      (n.links && n.links.some(l => l.title?.toLowerCase().includes(query) || l.url?.toLowerCase().includes(query)))
    );
  }, [notes, searchQuery]);

  return (
    <div className="w-screen h-screen relative overflow-hidden flex flex-col bg-slate-900 select-none">
      {/* 상단 윈도우 스타일 데스크톱 바 */}
      <header className="h-14 px-6 bg-slate-900/80 backdrop-blur-md border-b border-slate-700/60 flex items-center justify-between z-50 text-white select-none">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-400 to-yellow-200 flex items-center justify-center text-slate-900 font-bold shadow-md shadow-amber-500/20">
            📝
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold tracking-tight bg-gradient-to-r from-amber-200 via-yellow-100 to-white bg-clip-text text-transparent">
              Sticky Notes Desktop
            </span>
            <span className="text-[10px] text-slate-400">윈도우 PC 포스트잇 메모장</span>
          </div>
        </div>

        {/* 검색 */}
        <div className="relative max-w-sm w-72">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="메모 및 링크 실시간 검색..."
            className="w-full pl-9 pr-8 py-1.5 text-xs bg-slate-800/90 text-slate-100 rounded-full border border-slate-700 focus:outline-none focus:border-amber-400/80 placeholder-slate-400"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* 액션 컨트롤 */}
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => handleAddNote()}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold rounded-lg shadow transition-all active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>새 메모 추가</span>
          </button>

          <button
            type="button"
            onClick={handleAlignNotes}
            title="화면에 바둑판식으로 정렬"
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs flex items-center gap-1 transition-all"
          >
            <Grid className="w-4 h-4" />
            <span className="hidden sm:inline">자동 정렬</span>
          </button>

          <button
            type="button"
            onClick={handleExportJSON}
            title="JSON 파일로 백업"
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs transition-all"
          >
            <Save className="w-4 h-4" />
          </button>

          <label
            title="JSON 백업 파일 복원"
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs cursor-pointer transition-all flex items-center"
          >
            <Upload className="w-4 h-4" />
            <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
          </label>

          <div className="text-xs text-slate-400 pl-2 border-l border-slate-700">
            총 <span className="font-semibold text-amber-300">{notes.length}</span>개
          </div>
        </div>
      </header>

      {/* 데스크톱 바탕 캔버스 */}
      <main className="flex-1 w-full h-full relative overflow-hidden">
        {notes.length === 0 ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 select-none space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-3xl">
              📌
            </div>
            <div className="text-center">
              <p className="text-base font-semibold text-slate-200">남겨진 스티커 메모가 없습니다</p>
              <p className="text-xs text-slate-400 mt-1">상단의 [+ 새 메모 추가] 버튼을 눌러 새 포스트잇을 작성해보세요.</p>
            </div>
            <button
              type="button"
              onClick={() => handleAddNote()}
              className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 text-sm font-bold rounded-lg shadow"
            >
              지금 첫 메모 작성하기
            </button>
          </div>
        ) : (
          filteredNotes.map(note => (
            <StickyNoteCard
              key={note.id}
              note={note}
              onUpdate={handleUpdateNote}
              onDelete={handleDeleteNote}
              onBringToFront={handleBringToFront}
              onAddRelativeNote={(x, y) => handleAddNote(x, y)}
              onOpenLightbox={(url, name) => setLightboxImage({ url, name })}
            />
          ))
        )}
      </main>

      {/* 토스트 알림 */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 px-4 py-2.5 bg-slate-900/90 backdrop-blur border border-amber-400/40 text-amber-200 text-xs rounded-xl shadow-2xl z-50 animate-bounce flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* 이미지 라이트박스 */}
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[999] flex items-center justify-center p-6 cursor-zoom-out"
        >
          <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
            <img
              src={lightboxImage.url}
              alt={lightboxImage.name}
              className="max-w-full max-h-[80vh] rounded-lg shadow-2xl object-contain border border-white/20"
            />
            <div className="mt-3 flex items-center justify-between w-full text-white text-xs px-2">
              <span className="truncate font-medium">{lightboxImage.name}</span>
              <button
                type="button"
                onClick={() => setLightboxImage(null)}
                className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded-md font-semibold transition-colors"
              >
                닫기 (ESC)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
