import React, { useState, useCallback, useEffect, useRef } from 'react';
import { editImage } from '../services/geminiService';
import { SparklesIcon, UploadIcon, LeftRightArrowIcon, FullScreenIcon, CloseIcon, SwitchHorizontalIcon, EyeIcon, DownloadIcon, InfoIcon, CheckCircleSolidIcon, CropIcon } from './icons/Icons';

interface ImageProcessorProps {
    prompt: string;
    buttonText: string;
    children?: React.ReactNode;
    onFileChange?: () => void;
    onImageLoad?: (imageElement: HTMLImageElement) => void;
}

const formatFileSize = (bytes: number): string => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const getBase64Size = (dataUrl: string): number => {
    const base64 = dataUrl.substring(dataUrl.indexOf(',') + 1);
    let padding = 0;
    if (base64.endsWith('==')) {
        padding = 2;
    } else if (base64.endsWith('=')) {
        padding = 1;
    }
    return (base64.length * 3 / 4) - padding;
};

const SkeletonLoader: React.FC = () => (
    <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-slate-50">
        <div 
            className="w-16 h-16 border-4 border-sky-600 border-t-transparent rounded-full animate-spin" 
            role="status" 
            aria-live="polite" 
            aria-label="Đang xử lý ảnh"
        ></div>
        <p className="text-slate-600 font-medium mt-4 text-center">
            Vui lòng đợi trong giây lát...
        </p>
    </div>
);

type CropPreset = '4x6' | '3x4' | '2x3';

const ImageProcessor: React.FC<ImageProcessorProps> = ({ prompt, buttonText, children, onFileChange, onImageLoad }) => {
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [originalImage, setOriginalImage] = useState<string | null>(null);
    const [originalImageSize, setOriginalImageSize] = useState<number | null>(null);
    const [processedImage, setProcessedImage] = useState<string | null>(null);
    const [processedImageSize, setProcessedImageSize] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [responseText, setResponseText] = useState<string | null>(null);
    const [sliderPosition, setSliderPosition] = useState(50);
    const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
    const [fullscreenSliderPosition, setFullscreenSliderPosition] = useState(50);
    const [viewMode, setViewMode] = useState<'slider' | 'toggle'>('slider');
    const [showProcessedInToggle, setShowProcessedInToggle] = useState(true);
    const [showProcessedInFullscreenToggle, setShowProcessedInFullscreenToggle] = useState(true);
    const [isDragging, setIsDragging] = useState<boolean>(false);
    const [aspectRatio, setAspectRatio] = useState<string | null>(null);

    // Cropping state
    const [isCropping, setIsCropping] = useState<boolean>(false);
    const [crop, setCrop] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
    const [activePreset, setActivePreset] = useState<CropPreset | null>(null);

    const originalImageRef = useRef<HTMLImageElement>(null);
    const processedImageRef = useRef<HTMLImageElement>(null);
    const imageContainerRef = useRef<HTMLDivElement>(null);
    const dragInfo = useRef({ isDragging: false, startX: 0, startY: 0, initialX: 0, initialY: 0 });
    
    useEffect(() => {
        if (processedImage) {
            setSliderPosition(50);
            setFullscreenSliderPosition(50);
            setShowProcessedInToggle(true);
            setShowProcessedInFullscreenToggle(true);
        }
    }, [processedImage]);


    const fileToBase64 = (file: File): Promise<{ base64: string; mimeType: string }> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                const result = reader.result as string;
                const mimeType = result.substring(5, result.indexOf(';'));
                const base64 = result.substring(result.indexOf(',') + 1);
                resolve({ base64, mimeType });
            };
            reader.onerror = (error) => reject(error);
        });
    };

    const processFile = (file: File | null) => {
        if (!file) return;

        const allowedTypes = ['image/png', 'image/jpeg', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            setError('Định dạng tệp không hợp lệ. Vui lòng chọn PNG, JPG, hoặc WEBP.');
            return;
        }

        const maxSizeInMB = 30;
        if (file.size > maxSizeInMB * 1024 * 1024) {
            setError(`Tệp quá lớn. Vui lòng chọn tệp nhỏ hơn ${maxSizeInMB}MB.`);
            return;
        }

        onFileChange?.();
        setImageFile(file);
        setOriginalImage(URL.createObjectURL(file));
        setOriginalImageSize(file.size);
        setProcessedImage(null);
        setProcessedImageSize(null);
        setError(null);
        setResponseText(null);
        setAspectRatio(null);
        setIsCropping(false);
        setCrop(null);
        setActivePreset(null);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        processFile(e.target.files?.[0] || null);
    };
    
    const handleDragEnter = (e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };
    
    const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        processFile(e.dataTransfer.files?.[0] || null);
    };

    const handleSubmit = async () => {
        if (!imageFile) {
            setError("Vui lòng chọn một tệp ảnh.");
            return;
        }
        setIsLoading(true);
        setError(null);
        setProcessedImage(null);
        setProcessedImageSize(null);
        setResponseText(null);
        setIsCropping(false);

        try {
            const { base64, mimeType } = await fileToBase64(imageFile);
            
            const result = await editImage(base64, mimeType, prompt);
            
            if (result.imageUrl) {
                 setProcessedImage(result.imageUrl);
                 setProcessedImageSize(getBase64Size(result.imageUrl));
            } else {
                 setError("Không thể tạo ảnh. Vui lòng thử lại với một ảnh hoặc lời nhắc khác.");
            }
            if(result.text){
                setResponseText(result.text);
            }

        } catch (err) {
            console.error("Detailed Error:", err);
            let errorMessage = "Đã xảy ra lỗi không mong muốn khi xử lý ảnh của bạn. Vui lòng thử lại.";
            if (err instanceof Error) {
                const message = err.message.toLowerCase();
                 if (message.includes('api key')) {
                    errorMessage = "API key không hợp lệ hoặc bị thiếu. Vui lòng đảm bảo rằng nó đã được cấu hình chính xác.";
                } else if (message.includes('network') || message.includes('failed to fetch')) {
                    errorMessage = "Lỗi mạng. Vui lòng kiểm tra kết nối internet của bạn và thử lại.";
                } else if (message.includes('image') || message.includes('mime_type')) {
                     errorMessage = "Định dạng ảnh không được hỗ trợ hoặc tệp bị hỏng. Vui lòng thử một ảnh khác.";
                } else if (message.includes('safety') || message.includes('blocked')) {
                    errorMessage = "Yêu cầu của bạn đã bị chặn vì lý do an toàn. Vui lòng điều chỉnh lời nhắc hoặc sử dụng một ảnh khác.";
                } else if (message.includes('400')) { // Bad Request
                    errorMessage = "Yêu cầu không hợp lệ. Vui lòng kiểm tra lại ảnh và lời nhắc của bạn.";
                } else if (message.includes('500')) { // Server Error
                     errorMessage = "Dịch vụ đang gặp sự cố. Vui lòng thử lại sau ít phút.";
                }
            }
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDownload = () => {
        if (!processedImage || !imageFile) return;

        const link = document.createElement('a');
        link.href = processedImage;

        const originalName = imageFile.name.split('.').slice(0, -1).join('.');
        const processedMimeType = processedImage.substring(5, processedImage.indexOf(';'));
        const processedExtension = processedMimeType.split('/')[1] || 'png';
        link.download = `${originalName}-processed.${processedExtension}`;

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleKeyDown = useCallback((event: KeyboardEvent) => {
        if (event.key === 'Escape') {
            setIsFullscreen(false);
            if (isCropping) {
                setIsCropping(false);
                setCrop(null);
                setActivePreset(null);
            }
        }
    }, [isCropping]);

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [handleKeyDown]);

    // Cropping handlers
    const handleStartCrop = (preset: CropPreset) => {
        if (!processedImageRef.current) return;
        setActivePreset(preset);
    
        const aspectRatios: Record<CropPreset, number> = { '4x6': 4/6, '3x4': 3/4, '2x3': 2/3 };
        const aspectRatio = aspectRatios[preset];
    
        const image = processedImageRef.current;
        const { clientWidth: containerWidth, clientHeight: containerHeight } = image;
    
        let cropWidth, cropHeight;
        
        if (containerWidth / containerHeight > aspectRatio) {
            // Limited by height
            cropHeight = containerHeight * 0.9;
            cropWidth = cropHeight * aspectRatio;
        } else {
            // Limited by width
            cropWidth = containerWidth * 0.9;
            cropHeight = cropWidth / aspectRatio;
        }
    
        setCrop({
            x: (containerWidth - cropWidth) / 2,
            y: (containerHeight - cropHeight) / 2,
            width: cropWidth,
            height: cropHeight,
        });
        setIsCropping(true);
    };

    const handleCancelCrop = () => {
        setIsCropping(false);
        setCrop(null);
        setActivePreset(null);
    };

    const handleApplyCrop = () => {
        if (!processedImageRef.current || !crop) return;

        const image = processedImageRef.current;
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const { naturalWidth, naturalHeight, clientWidth, clientHeight } = image;

        // Calculate scale between displayed image and natural image
        const scaleX = naturalWidth / clientWidth;
        const scaleY = naturalHeight / clientHeight;

        // Convert crop coordinates from display pixels to natural pixels
        const cropX = crop.x * scaleX;
        const cropY = crop.y * scaleY;
        const cropWidth = crop.width * scaleX;
        const cropHeight = crop.height * scaleY;

        canvas.width = cropWidth;
        canvas.height = cropHeight;

        ctx.drawImage(
            image,
            cropX, cropY, cropWidth, cropHeight, // source rect
            0, 0, cropWidth, cropHeight          // destination rect
        );

        const croppedDataUrl = canvas.toDataURL('image/png');
        setProcessedImage(croppedDataUrl);
        setProcessedImageSize(getBase64Size(croppedDataUrl));
        handleCancelCrop(); // Reset state
    };
    
    const handleDragStart = (e: React.MouseEvent<HTMLDivElement>) => {
        e.preventDefault();
        if (!crop) return;
        dragInfo.current = {
            isDragging: true,
            startX: e.clientX,
            startY: e.clientY,
            initialX: crop.x,
            initialY: crop.y
        };
        window.addEventListener('mousemove', handleDragging);
        window.addEventListener('mouseup', handleDragEnd);
    };

    const handleDragging = (e: MouseEvent) => {
        if (!dragInfo.current.isDragging || !crop || !processedImageRef.current) return;

        const dx = e.clientX - dragInfo.current.startX;
        const dy = e.clientY - dragInfo.current.startY;

        const { clientWidth: containerWidth, clientHeight: containerHeight } = processedImageRef.current;
        
        let newX = dragInfo.current.initialX + dx;
        let newY = dragInfo.current.initialY + dy;

        // Constrain movement
        newX = Math.max(0, Math.min(newX, containerWidth - crop.width));
        newY = Math.max(0, Math.min(newY, containerHeight - crop.height));

        setCrop(prev => prev ? { ...prev, x: newX, y: newY } : null);
    };

    const handleDragEnd = () => {
        dragInfo.current.isDragging = false;
        window.removeEventListener('mousemove', handleDragging);
        window.removeEventListener('mouseup', handleDragEnd);
    };


    const cropPresets: {key: CropPreset, name: string}[] = [
        { key: '4x6', name: '4x6' },
        { key: '3x4', name: '3x4' },
        { key: '2x3', name: '2x3' },
    ];

    return (
        <>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Control Panel */}
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Bước 1: Tải ảnh lên</label>
                        <div className="flex items-center justify-center w-full">
                            <label 
                                htmlFor="dropzone-file" 
                                className={`flex flex-col items-center justify-center w-full border-2 border-dashed rounded-lg cursor-pointer transition-all duration-300 ease-in-out transform
                                    ${isDragging 
                                        ? 'border-sky-500 bg-sky-100 scale-105 shadow-xl ring-2 ring-sky-200' 
                                        : imageFile 
                                            ? 'border-green-400 bg-green-50 hover:bg-green-100' 
                                            : 'border-gray-300 bg-gray-50 hover:bg-gray-100 hover:border-sky-400'
                                    }
                                    ${imageFile ? 'p-4' : 'h-48'}`
                                }
                                onDragEnter={handleDragEnter}
                                onDragLeave={handleDragLeave}
                                onDragOver={handleDragOver}
                                onDrop={handleDrop}
                            >
                                {imageFile && originalImage ? (
                                    <div className="flex flex-col items-center text-center w-full">
                                        <div className="flex items-center gap-4 w-full">
                                            <img src={originalImage} alt="Xem trước ảnh" className="w-16 h-16 rounded-lg object-cover border border-gray-200 flex-shrink-0" />
                                            <div className="text-left overflow-hidden">
                                                <p className="font-semibold text-green-700">Tải lên thành công!</p>
                                                <p className="text-sm text-gray-600 truncate" title={imageFile.name}>{imageFile.name}</p>
                                                {originalImageSize && <p className="text-xs text-gray-500">{formatFileSize(originalImageSize)}</p>}
                                            </div>
                                        </div>
                                        <p className="mt-3 text-sm text-sky-600 font-semibold hover:underline">Nhấn hoặc kéo tệp khác để thay thế</p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
                                        <UploadIcon />
                                        <p className={`mb-2 text-sm transition-colors ${isDragging ? 'text-sky-700 font-bold' : 'text-gray-500'}`}>
                                            <span className="font-semibold">{isDragging ? 'Thả tệp vào đây!' : 'Nhấn để tải lên'}</span> hoặc kéo và thả
                                        </p>
                                        <p className="text-xs text-gray-500">PNG, JPG, WEBP (Tối đa 30MB)</p>
                                    </div>
                                )}
                                <input id="dropzone-file" type="file" className="hidden" accept="image/png, image/jpeg, image/webp" onChange={handleFileChange} />
                            </label>
                        </div>
                    </div>
                    {children}
                    <button
                        onClick={handleSubmit}
                        disabled={isLoading || !imageFile}
                        className="w-full flex items-center justify-center bg-sky-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-sky-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                         {isLoading ? (
                            <>
                               <div className="animate-spin -ml-1 mr-3 h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                               <span>Đang xử lý...</span>
                            </>
                        ) : (
                           <>
                           <SparklesIcon className="h-5 w-5 mr-2" />
                           <span>{buttonText}</span>
                           </>
                        )}
                    </button>
                    {error && <p className="text-red-600 text-sm text-center">{error}</p>}
                </div>
            </div>

             {/* Image Display */}
             <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 flex flex-col justify-between">
                <div>
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="font-bold text-gray-700">{isCropping ? 'Cắt ảnh' : 'So sánh kết quả'}</h3>
                        {processedImage && !isLoading && !isCropping && (
                        <div className="flex items-center gap-1 p-1 bg-gray-200 rounded-lg">
                            <button 
                                onClick={() => setViewMode('slider')}
                                className={`p-1.5 rounded-md transition-colors ${viewMode === 'slider' ? 'bg-white text-sky-600 shadow-sm' : 'text-gray-500 hover:bg-gray-300'}`}
                                aria-label="Chế độ thanh trượt"
                                title="Chế độ thanh trượt"
                            >
                                <SwitchHorizontalIcon className="h-5 w-5" />
                            </button>
                            <button 
                                onClick={() => setViewMode('toggle')}
                                className={`p-1.5 rounded-md transition-colors ${viewMode === 'toggle' ? 'bg-white text-sky-600 shadow-sm' : 'text-gray-500 hover:bg-gray-300'}`}
                                aria-label="Chế độ xem nhanh"
                                title="Chế độ xem nhanh"
                            >
                                <EyeIcon className="h-5 w-5" />
                            </button>
                        </div>
                        )}
                    </div>
                    <div
                        ref={imageContainerRef}
                        className={`relative w-full max-w-full mx-auto bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200 overflow-hidden transition-all duration-300 ${!aspectRatio ? 'h-[480px]' : ''}`}
                        style={{ aspectRatio: aspectRatio || undefined }}
                    >
                        {isLoading ? (
                            <SkeletonLoader />
                        ) : !originalImage ? (
                            <p className="text-gray-400">Xem trước ảnh gốc & kết quả</p>
                        ) : isCropping && processedImage && crop ? (
                            <>
                                <img
                                    ref={processedImageRef}
                                    src={processedImage}
                                    alt="Cropping"
                                    className="block w-full h-full object-contain"
                                />
                                <div className="absolute inset-0 bg-black/60" style={{ clipPath: `polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%, ${crop.x}px ${crop.y}px, ${crop.x}px ${crop.y + crop.height}px, ${crop.x + crop.width}px ${crop.y + crop.height}px, ${crop.x + crop.width}px ${crop.y}px, ${crop.x}px ${crop.y}px)`}} />
                                <div
                                    className="absolute border-2 border-dashed border-white cursor-move select-none"
                                    style={{ left: crop.x, top: crop.y, width: crop.width, height: crop.height }}
                                    onMouseDown={handleDragStart}
                                >
                                    <div className="absolute -top-3 -right-3 w-5 h-5 bg-white rounded-full border-2 border-sky-500" />
                                    <div className="absolute -bottom-3 -right-3 w-5 h-5 bg-white rounded-full border-2 border-sky-500" />
                                    <div className="absolute -bottom-3 -left-3 w-5 h-5 bg-white rounded-full border-2 border-sky-500" />
                                    <div className="absolute -top-3 -left-3 w-5 h-5 bg-white rounded-full border-2 border-sky-500" />
                                </div>
                            </>
                        ) : (
                            <>
                                <img 
                                    ref={originalImageRef}
                                    src={originalImage} 
                                    alt="Original" 
                                    className={`block w-full h-full object-contain transition-opacity duration-300`}
                                    onLoad={() => {
                                        if (originalImageRef.current) {
                                            const { naturalWidth, naturalHeight } = originalImageRef.current;
                                            setAspectRatio(`${naturalWidth} / ${naturalHeight}`);
                                            if (onImageLoad) {
                                                onImageLoad(originalImageRef.current);
                                            }
                                        }
                                    }}
                                 />
                                {processedImage && (
                                    <img
                                        ref={processedImageRef}
                                        src={processedImage}
                                        alt="Processed"
                                        className="absolute top-0 left-0 w-full h-full object-contain opacity-0 pointer-events-none" // Keep it in the DOM for ref but invisible
                                    />
                                )}
                                
                                {viewMode === 'slider' && (
                                    <>
                                        {processedImage && (
                                            <div className="absolute top-0 left-0 w-full h-full" style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}>
                                                <img src={processedImage} alt="Processed" className={`block w-full h-full object-contain transition-opacity duration-300`} />
                                            </div>
                                        )}
                                        {processedImage && (
                                            <>
                                                <button
                                                    onClick={() => setIsFullscreen(true)}
                                                    className="absolute top-3 right-3 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-opacity z-20"
                                                    aria-label="Xem toàn màn hình"
                                                    title="Xem toàn màn hình"
                                                >
                                                    <FullScreenIcon />
                                                </button>
                                                <div className="absolute top-0 bottom-0 w-1 bg-white/50 backdrop-blur-sm cursor-col-resize pointer-events-none" style={{ left: `calc(${sliderPosition}% - 0.5px)` }}>
                                                    <div className="absolute top-1/2 -translate-y-1/2 -left-4 w-9 h-9 rounded-full bg-white/80 shadow-md border-2 border-white flex items-center justify-center pointer-events-none">
                                                        <LeftRightArrowIcon />
                                                    </div>
                                                </div>
                                                <input
                                                    type="range"
                                                    min="0"
                                                    max="100"
                                                    value={sliderPosition}
                                                    onInput={(e: React.ChangeEvent<HTMLInputElement>) => setSliderPosition(Number(e.target.value))}
                                                    className="absolute inset-0 w-full h-full cursor-col-resize opacity-0"
                                                    aria-label="Image comparison slider"
                                                />
                                            </>
                                        )}
                                    </>
                                )}

                                {viewMode === 'toggle' && (
                                    <>
                                        {processedImage && (
                                            <img 
                                                src={processedImage} 
                                                alt="Processed" 
                                                className={`absolute inset-0 block w-full h-full object-contain transition-opacity duration-300 ${showProcessedInToggle ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} 
                                            />
                                        )}
                                        {processedImage && (
                                            <>
                                                <button
                                                    onClick={() => { setIsFullscreen(true); setShowProcessedInFullscreenToggle(true); }}
                                                    className="absolute top-3 right-3 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-opacity z-20"
                                                    aria-label="Xem toàn màn hình"
                                                    title="Xem toàn màn hình"
                                                >
                                                    <FullScreenIcon />
                                                </button>
                                                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 p-1.5 bg-black/50 backdrop-blur-sm rounded-lg z-20">
                                                    <button 
                                                        onClick={() => setShowProcessedInToggle(false)}
                                                        className={`px-3 py-1 text-sm rounded-md transition-colors ${!showProcessedInToggle ? 'bg-white text-slate-800 font-semibold' : 'bg-transparent text-white hover:bg-white/20'}`}
                                                    >
                                                        Gốc
                                                    </button>
                                                    <button 
                                                        onClick={() => setShowProcessedInToggle(true)}
                                                        className={`px-3 py-1 text-sm rounded-md transition-colors ${showProcessedInToggle ? 'bg-white text-slate-800 font-semibold' : 'bg-transparent text-white hover:bg-white/20'}`}
                                                    >
                                                        Kết quả
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </>
                                )}
                            </>
                        )}
                    </div>
                </div>
                
                {processedImage && !isLoading && !isCropping && (
                    <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-lg">
                        <h4 className="font-semibold text-sm text-gray-700 mb-3">Cắt ảnh (Tùy chọn)</h4>
                        <div className="grid grid-cols-3 gap-3">
                            {cropPresets.map(({key, name}) => (
                                <button
                                    key={key}
                                    onClick={() => handleStartCrop(key)}
                                    className={`w-full text-center px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-200 border-2 ${activePreset === key ? 'bg-sky-600 text-white border-sky-700 shadow-md' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'}`}
                                >
                                    {name}
                                </button>
                            ))}
                        </div>
                        <p className="text-xs text-red-600 mt-3 text-center">Lưu ý: mỗi lần bấm tùy chọn cắt ảnh phải tạo lại ảnh để tránh bị lỗi.</p>
                    </div>
                )}

                 {isCropping && (
                    <div className="mt-4 flex gap-3">
                        <button
                            onClick={handleApplyCrop}
                            className="w-full flex items-center justify-center bg-sky-600 text-white font-bold py-2.5 px-4 rounded-lg hover:bg-sky-700 transition-colors"
                        >
                           <CheckCircleSolidIcon className="h-5 w-5 mr-2"/>
                            Áp dụng
                        </button>
                        <button
                            onClick={handleCancelCrop}
                            className="w-full flex items-center justify-center bg-gray-200 text-gray-700 font-bold py-2.5 px-4 rounded-lg hover:bg-gray-300 transition-colors"
                        >
                            Hủy
                        </button>
                    </div>
                )}
                
                {processedImage && !isLoading && !isCropping && (
                     <div className="mt-4">
                        <button
                            onClick={handleDownload}
                            className="w-full flex items-center justify-center bg-emerald-600 text-white font-bold py-2.5 px-4 rounded-lg hover:bg-emerald-700 transition-colors"
                        >
                            <DownloadIcon className="h-5 w-5 mr-2" />
                            <span>Tải ảnh về</span>
                            {processedImageSize && (
                                <div className="flex items-center ml-2">
                                    <span className="text-xs opacity-80">({formatFileSize(processedImageSize)})</span>
                                    <div className="relative group ml-1.5">
                                        <InfoIcon className="h-4 w-4 text-white/70" />
                                        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-64 p-2 bg-slate-700 text-white text-xs text-center rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                            AI đang cố gắng khớp với dung lượng tệp gốc ({originalImageSize ? formatFileSize(originalImageSize) : 'N/A'}). Dung lượng cuối cùng có thể thay đổi tùy thuộc vào độ phức tạp của ảnh.
                                            <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-slate-700"></div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </button>
                    </div>
                )}

                {responseText && !error && !isLoading && (
                    <div className="mt-4 p-3 bg-sky-50 border border-sky-200 rounded-lg text-sm text-sky-800">
                        <p><span className="font-bold">Phản hồi từ AI:</span> {responseText}</p>
                    </div>
                )}
            </div>
        </div>

        {isFullscreen && originalImage && processedImage && (
            <div
                className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 modal-fade-in"
                onClick={() => setIsFullscreen(false)}
                role="dialog"
                aria-modal="true"
            >
                <button
                    onClick={(e) => { e.stopPropagation(); setIsFullscreen(false); }}
                    className="absolute top-4 right-4 p-2 text-white bg-black/40 rounded-full hover:bg-black/60 transition-opacity z-30"
                    aria-label="Đóng"
                    title="Đóng (Esc)"
                >
                    <CloseIcon />
                </button>
                <div className="relative w-full h-full flex items-center justify-center" onClick={e => e.stopPropagation()}>
                   {viewMode === 'slider' ? (
                        <div className="relative" style={{ lineHeight: 0 }}>
                            <img
                                src={originalImage}
                                alt="Ảnh gốc"
                                className={`max-w-[95vw] max-h-[95vh] object-contain rounded-lg shadow-2xl`}
                            />
                            <div className="absolute top-0 left-0 w-full h-full" style={{ clipPath: `inset(0 ${100 - fullscreenSliderPosition}% 0 0)` }}>
                                <img
                                    src={processedImage}
                                    alt="Kết quả xử lý"
                                    className={`w-full h-full object-contain rounded-lg`}
                                />
                            </div>
                            
                            <div className="absolute top-0 bottom-0 w-1 bg-white/50 backdrop-blur-sm cursor-col-resize pointer-events-none z-10" style={{ left: `calc(${fullscreenSliderPosition}% - 0.5px)` }}>
                                <div className="absolute top-1/2 -translate-y-1/2 -left-4 w-9 h-9 rounded-full bg-white/80 shadow-md border-2 border-white flex items-center justify-center pointer-events-none">
                                    <LeftRightArrowIcon />
                                </div>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={fullscreenSliderPosition}
                                onInput={(e: React.ChangeEvent<HTMLInputElement>) => setFullscreenSliderPosition(Number(e.target.value))}
                                className="absolute inset-0 w-full h-full cursor-col-resize opacity-0 z-20"
                                aria-label="Image comparison slider"
                            />
                        </div>
                   ) : (
                        <div className="relative" style={{ lineHeight: 0 }}>
                            <img
                                src={originalImage}
                                alt="Ảnh gốc"
                                className={`max-w-[95vw] max-h-[95vh] object-contain rounded-lg shadow-2xl`}
                            />
                            <img
                                src={processedImage}
                                alt="Kết quả xử lý"
                                className={`absolute inset-0 w-full h-full object-contain rounded-lg transition-opacity duration-300 ${showProcessedInFullscreenToggle ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                            />
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 p-1.5 bg-black/50 backdrop-blur-sm rounded-lg z-20">
                                <button 
                                    onClick={() => setShowProcessedInFullscreenToggle(false)}
                                    className={`px-4 py-1.5 text-sm rounded-md transition-colors ${!showProcessedInFullscreenToggle ? 'bg-white text-slate-800 font-semibold' : 'bg-transparent text-white hover:bg-white/20'}`}
                                >
                                    Gốc
                                </button>
                                <button 
                                    onClick={() => setShowProcessedInFullscreenToggle(true)}
                                    className={`px-4 py-1.5 text-sm rounded-md transition-colors ${showProcessedInFullscreenToggle ? 'bg-white text-slate-800 font-semibold' : 'bg-transparent text-white hover:bg-white/20'}`}
                                >
                                    Kết quả
                                </button>
                            </div>
                        </div>
                   )}
                </div>
            </div>
        )}
        </>
    );
};

export default ImageProcessor;