import React, { useState, useMemo } from 'react';
import ImageProcessor from '../components/ImageProcessor';
import { ChevronDownIcon } from '../components/icons/Icons';

// Because the FaceDetector API is still experimental, the type might not be available in default TypeScript lib.
declare global {
    interface Window {
        FaceDetector: any;
    }
}

type BackgroundOption = 'lightBlue' | 'white' | 'lightGray' | 'darkBlue' | 'mediumGray' | 'green' | 'red' | 'custom';
type BlemishRemoval = 'none' | 'light' | 'heavy';
type FaceShape = 'keep' | 'v-line' | 'slimmer';
type SkinSmoothing = 'none' | 'light' | 'standard';

const presetBackgrounds: { name: BackgroundOption, color: string, label: string, promptColorName: string }[] = [
    { name: 'lightBlue', color: '#E0F2FE', label: 'Xanh nhạt', promptColorName: 'very light blue' },
    { name: 'white', color: '#ffffff', label: 'Trắng', promptColorName: 'white' },
    { name: 'lightGray', color: '#E5E7EB', label: 'Xám nhạt', promptColorName: 'light gray' },
    { name: 'darkBlue', color: '#1E3A8A', label: 'Xanh đậm', promptColorName: 'dark blue' },
    { name: 'mediumGray', color: '#9CA3AF', label: 'Xám vừa', promptColorName: 'medium gray' },
    { name: 'green', color: '#D1FAE5', label: 'Xanh lá cây', promptColorName: 'pale green' },
    { name: 'red', color: '#FEE2E2', label: 'Đỏ nhạt', promptColorName: 'pale red' },
];

const IdPhotoEditor: React.FC = () => {
    const [backgroundOption, setBackgroundOption] = useState<BackgroundOption | null>(null);
    const [customColor, setCustomColor] = useState('#e0e0e0');
    const [gender, setGender] = useState<'male' | 'female' | null>(null);
    const [outfit, setOutfit] = useState<string | null>(null);
    const [hairStyle, setHairStyle] = useState<'keep' | 'auto' | 'front' | 'back' | null>('keep');
    const [faceOptions, setFaceOptions] = useState<string[]>(['keep']);
    const [blemishRemoval, setBlemishRemoval] = useState<BlemishRemoval>('none');
    const [faceShape, setFaceShape] = useState<FaceShape>('keep');
    const [skinSmoothing, setSkinSmoothing] = useState<SkinSmoothing>('none');
    const [eyeColor, setEyeColor] = useState<string>('keep');
    const [isBackgroundOptionsOpen, setIsBackgroundOptionsOpen] = useState(false);
    const [isOutfitOptionsOpen, setIsOutfitOptionsOpen] = useState(false);
    const [isHairStyleOptionsOpen, setIsHairStyleOptionsOpen] = useState(false);
    const [isFaceOptionsOpen, setIsFaceOptionsOpen] = useState(false);
    
    const [faceDetected, setFaceDetected] = useState<boolean | null>(null);
    const [isDetectingFaces, setIsDetectingFaces] = useState<boolean>(false);

    const maleOutfits: { [key: string]: string } = {
        'none': 'Không đổi',
        'white_shirt': 'Áo sơ mi trắng',
        'blue_shirt': 'Áo sơ mi xanh',
        'black_shirt': 'Áo sơ mi đen',
        'black_vest_red_tie': 'Vest đen, cà vạt đỏ',
        'blue_vest_red_tie': 'Vest xanh, cà vạt đỏ',
    };

    const femaleOutfits: { [key: string]: string } = {
        'none': 'Không đổi',
        'white_shirt': 'Áo sơ mi trắng',
        'youth_union_shirt': 'Áo Đoàn Thanh Niên',
        'blue_ao_dai': 'Áo dài xanh',
        'white_ao_dai': 'Áo dài trắng',
        'red_ao_dai': 'Áo dài đỏ',
        'deep_red_ao_dai': 'Áo dài đỏ thẫm',
        'womens_office_vest': 'Vest công sở nữ',
    };

    const hairStyles: { [key: string]: string } = {
        'keep': 'Giữ nguyên',
        'auto': 'Tự động',
        'front': 'Thả trước',
        'back': 'Vuốt sau',
    };

    const faceOptionsMap: { [key: string]: string } = {
        'keep': 'Giữ nguyên nét mặt gốc',
        'slight_smile': 'Cười Nhẹ',
    };
    
    const blemishRemovalOptions: { [key in BlemishRemoval]: string } = {
        'none': 'Không',
        'light': 'Nhẹ',
        'heavy': 'Kỹ',
    };

    const faceShapeOptions: { [key in FaceShape]: string } = {
        'keep': 'Giữ nguyên',
        'v-line': 'Mặt V-line',
        'slimmer': 'Làm thon gọn',
    };

    const skinSmoothingOptions: { [key in SkinSmoothing]: string } = {
        'none': 'Không',
        'light': 'Nhẹ',
        'standard': 'Tiêu chuẩn',
    };

    const eyeColors: { [key: string]: string } = {
        'keep': 'Giữ nguyên',
        'black': 'Đen',
        'dark_brown': 'Nâu đậm',
        'light_brown': 'Nâu nhạt',
        'blue': 'Xanh dương',
        'green': 'Xanh lá',
    };

    const handleFaceOptionToggle = (key: string) => {
        setFaceOptions(prev => {
            if (key === 'keep') {
                return prev.includes('keep') ? prev.filter(opt => opt !== 'keep') : ['keep'];
            }
            const newOptions = prev.filter(opt => opt !== 'keep');
            if (newOptions.includes(key)) {
                return newOptions.filter(opt => opt !== key);
            } else {
                return [...newOptions, key];
            }
        });
    };
    
    const resetFaceDetection = () => {
        setFaceDetected(null);
        setIsFaceOptionsOpen(false);
    };

    const handleImageLoadForFaceDetection = async (imageElement: HTMLImageElement) => {
        if (!('FaceDetector' in window)) {
            console.warn('FaceDetector API not supported by this browser.');
            setFaceDetected(null); 
            return;
        }

        setIsDetectingFaces(true);
        setFaceDetected(null);

        try {
            const faceDetector = new window.FaceDetector();
            const faces = await faceDetector.detect(imageElement);
            
            if (faces.length > 0) {
                setFaceDetected(true);
                setIsFaceOptionsOpen(true); 
            } else {
                setFaceDetected(false);
                setIsFaceOptionsOpen(false);
            }
        } catch (error) {
            console.error('Face detection failed:', error);
            setFaceDetected(false);
        } finally {
            setIsDetectingFaces(false);
        }
    };


    const prompt = useMemo(() => {
        let backgroundPromptPart = "Keep the original background.";
        if (backgroundOption) {
            let instruction = '';
            const preset = presetBackgrounds.find(p => p.name === backgroundOption);

            if (preset) {
                instruction = `a solid ${preset.promptColorName} color with the hex code ${preset.color}`;
            } else if (backgroundOption === 'custom') {
                instruction = `a solid color with the hex code ${customColor}`;
            }
            
            if (instruction) {
                backgroundPromptPart = `Change the background to ${instruction}.`;
            }
        }


        let clothingInstruction = "Keep the person's clothing as it is in the original photo. Do not change their outfit.";
        if (gender && outfit && outfit !== 'none') {
            const clothingDetails = " It is absolutely crucial to keep the person's face, head, hair, and neck completely unchanged from the original photo. Do not alter their size, shape, features, expression, or position. The new clothing must be seamlessly integrated below the neck, perfectly fitting the original image's frame and proportions without distorting the person's posture or changing the image dimensions. The resulting image must show the person from the waist up, suitable for a passport or ID photo.";
            
            if (gender === 'male') {
                switch (outfit) {
                    case 'white_shirt': clothingInstruction = "Change the person's clothing to a formal white dress shirt." + clothingDetails; break;
                    case 'blue_shirt': clothingInstruction = "Change the person's clothing to a formal light blue dress shirt." + clothingDetails; break;
                    case 'black_shirt': clothingInstruction = "Change the person's clothing to a formal black dress shirt." + clothingDetails; break;
                    case 'black_vest_red_tie': clothingInstruction = "Change the person's clothing to a formal black business suit with a white shirt and a red tie." + clothingDetails; break;
                    case 'blue_vest_red_tie': clothingInstruction = "Change the person's clothing to a formal dark blue business suit with a white shirt and a red tie." + clothingDetails; break;
                }
            } else { // female
                switch (outfit) {
                    case 'white_shirt': clothingInstruction = "Change the person's clothing to a formal white blouse suitable for an ID photo." + clothingDetails; break;
                    case 'youth_union_shirt': clothingInstruction = "Change the person's clothing to a Vietnamese Youth Union shirt (Áo Đoàn Thanh Niên). This is a dark blue, short-sleeved collared shirt. On the left chest area, there must be an emblem. The emblem must consist of a small, triangular red pennant flag with a yellow star inside. Directly below this flag, the text 'THANH NIÊN VIỆT NAM' should be clearly embroidered in yellow letters, with all words on a single line. The emblem should be positioned where a chest pocket would normally be." + clothingDetails; break;
                    case 'blue_ao_dai': clothingInstruction = "Change the person's clothing to a traditional Vietnamese blue Ao Dai, styled appropriately for a professional photo." + clothingDetails; break;
                    case 'white_ao_dai': clothingInstruction = "Change the person's clothing to a traditional Vietnamese white Ao Dai, styled appropriately for a professional photo." + clothingDetails; break;
                    case 'red_ao_dai': clothingInstruction = "Change the person's clothing to a traditional Vietnamese red Ao Dai, styled appropriately for a professional photo." + clothingDetails; break;
                    case 'deep_red_ao_dai': clothingInstruction = "Change the person's clothing to a traditional Vietnamese deep red (đỏ thẫm) Ao Dai, styled appropriately for a professional photo." + clothingDetails; break;
                    case 'womens_office_vest': clothingInstruction = "Change the person's clothing to a professional women's business suit or vest over a blouse." + clothingDetails; break;
                }
            }
        }

        let hairInstruction = "Keep the person's hair as it is.";
        switch (hairStyle) {
            case 'auto':
                hairInstruction = "Automatically style the hair to look neat and professional for an ID photo.";
                break;
            case 'front':
                hairInstruction = "Style the hair to be neatly combed down in the front.";
                break;
            case 'back':
                hairInstruction = "Style the hair to be neatly slicked back.";
                break;
        }
        
        let faceInstruction = "";
        const instructions: string[] = [];

        switch (blemishRemoval) {
            case 'light':
                instructions.push("remove minor, temporary blemishes such as pimples and spots. The overall skin texture must be preserved and look natural.");
                break;
            case 'heavy':
                instructions.push("thoroughly remove blemishes, spots, acne, and light scars. The result should be clear and clean skin, while critically maintaining a natural skin texture and avoiding a plastic or overly smooth look.");
                break;
        }

        switch (skinSmoothing) {
            case 'light':
                instructions.push("apply a light skin smoothing effect to even out skin tone and reduce very fine lines. The skin texture must be preserved and look completely natural.");
                break;
            case 'standard':
                instructions.push("apply a standard, professional-grade skin smoothing effect. Even out skin tone, reduce fine lines and pores slightly, but it is critical to maintain a natural skin texture and avoid a plastic or overly smooth, artificial look.");
                break;
        }

        if (faceOptions.includes('slight_smile')) {
            instructions.push("subtly adjust the person's expression to a gentle, closed-mouth, professional-looking smile");
        }
        
        switch (faceShape) {
            case 'v-line':
                instructions.push("subtly and realistically refine the jawline and chin to create a gentle V-line shape. The modification must be very slight, look completely natural, and not alter the person's recognizable identity.");
                break;
            case 'slimmer':
                instructions.push("subtly make the face look slightly slimmer. The modification must be very slight, look completely natural, and not alter the person's recognizable identity.");
                break;
        }


        if (instructions.length > 0) {
            faceInstruction = `Apply the following changes to the face: ${instructions.join(' and ')}. It is critical that you keep the original facial structure, identity, and all other features absolutely intact where not specified otherwise.`;
        } else { // This covers the case where the array is empty or only contains 'keep'
            faceInstruction = "Preserve the person's original facial features and expression with absolute fidelity. Do not make any changes to the nose, mouth, skin texture, or any other facial characteristic. The face must remain identical to the source image.";
        }

        let eyeInstruction = "Keep the original eye color with absolute fidelity.";
        if (eyeColor !== 'keep') {
            eyeInstruction = `Subtly and realistically change the person's eye color to a natural-looking ${eyeColors[eyeColor]}. The change must look natural and preserve all original details of the eyes, such as reflections and shape.`;
        }

        return `${backgroundPromptPart} ${clothingInstruction} ${hairInstruction} ${faceInstruction} ${eyeInstruction} The final image should look like a professional ID photo, showing the person from the waist up. Crucially, do not change the original image's dimensions, aspect ratio, or framing. The person's posture and position must remain exactly the same as in the original photo. Do not crop, resize, or alter the overall composition. The output image must have the exact same pixel dimensions (width and height) as the original input image. The final image must be of the highest possible professional quality, with a resolution of exactly 300 DPI, making it suitable for high-quality printing. It must be encoded as a lossless PNG to preserve maximum detail, fidelity, and color accuracy, with no compression artifacts.`;
    }, [backgroundOption, customColor, gender, outfit, hairStyle, faceOptions, eyeColor, blemishRemoval, faceShape, skinSmoothing]);
    
    return (
        <div>
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-slate-800">Chỉnh sửa ảnh thẻ</h1>
                <p className="text-slate-600 mt-1">PHẦN MỀM ĐƯỢỢC PHÁT TRIỂN BỞI SƠN TRỊNH</p>
            </div>
            <ImageProcessor 
                prompt={prompt}
                buttonText="Tạo ảnh thẻ"
                onFileChange={resetFaceDetection}
                onImageLoad={handleImageLoadForFaceDetection}
            >
                <div className="space-y-4">
                    <div className="rounded-lg shadow-sm">
                        <button
                            onClick={() => setIsBackgroundOptionsOpen(!isBackgroundOptionsOpen)}
                            className={`w-full flex justify-between items-center p-3 text-left bg-gray-50 hover:bg-gray-100 transition-colors border border-gray-200 ${isBackgroundOptionsOpen ? 'rounded-t-lg border-b-0' : 'rounded-lg'}`}
                            aria-expanded={isBackgroundOptionsOpen}
                            aria-controls="background-options"
                        >
                            <span className="font-medium text-gray-700 text-sm">Bước 2: Chọn màu nền</span>
                            <ChevronDownIcon className={`h-5 w-5 text-gray-600 transition-transform duration-300 ${isBackgroundOptionsOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {isBackgroundOptionsOpen && (
                            <div id="background-options" className="p-4 bg-white border border-t-0 border-gray-200 rounded-b-lg">
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Màu có sẵn</p>
                                        <div className="grid grid-cols-5 sm:grid-cols-7 gap-3">
                                            {presetBackgrounds.map(({ name, color, label }) => (
                                                <button
                                                    key={name}
                                                    onClick={() => setBackgroundOption(name)}
                                                    className={`w-9 h-9 rounded-full border-2 transition-all duration-200 ${backgroundOption === name ? 'border-sky-600 ring-2 ring-sky-600 ring-offset-2' : 'border-gray-300 hover:border-sky-400'}`}
                                                    style={{ backgroundColor: color }}
                                                    aria-label={`Chọn màu nền ${label}`}
                                                    title={label}
                                                />
                                            ))}
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-gray-200">
                                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Màu tùy chỉnh</p>
                                        <div className="flex items-center gap-3">
                                            <div className="relative">
                                                <label
                                                    htmlFor="custom-color-picker"
                                                    className={`block w-10 h-10 rounded-md border-2 cursor-pointer transition-all duration-200 ${backgroundOption === 'custom' ? 'border-sky-600 ring-2 ring-sky-600 ring-offset-1' : 'border-gray-300'}`}
                                                    style={{ backgroundColor: customColor }}
                                                    onClick={() => setBackgroundOption('custom')}
                                                    title="Chọn màu tùy chỉnh"
                                                />
                                                <input
                                                    id="custom-color-picker"
                                                    type="color"
                                                    value={customColor}
                                                    onChange={(e) => {
                                                        setBackgroundOption('custom');
                                                        setCustomColor(e.target.value);
                                                    }}
                                                    className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
                                                    aria-label="Bảng chọn màu tùy chỉnh"
                                                />
                                            </div>
                                            <div className="relative flex-1">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-mono text-sm">#</span>
                                                <input
                                                    type="text"
                                                    value={customColor.substring(1).toUpperCase()}
                                                    onChange={(e) => {
                                                        setBackgroundOption('custom');
                                                        let value = e.target.value.replace(/[^0-9a-fA-F]/g, '');
                                                        if (value.length > 6) value = value.substring(0, 6);
                                                        setCustomColor(`#${value.toLowerCase()}`);
                                                    }}
                                                    onBlur={(e) => {
                                                        let value = e.target.value.padEnd(6, e.target.value.slice(-1) || '0').slice(0, 6);
                                                        setCustomColor(`#${value.toLowerCase()}`);
                                                    }}
                                                    className="w-full pl-7 pr-2 py-2 border border-gray-300 rounded-md font-mono text-sm tracking-widest focus:ring-sky-500 focus:border-sky-500"
                                                    aria-label="Mã hex màu tùy chỉnh"
                                                    maxLength={6}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="rounded-lg shadow-sm">
                        <button
                            onClick={() => setIsHairStyleOptionsOpen(!isHairStyleOptionsOpen)}
                            className={`w-full flex justify-between items-center p-3 text-left bg-gray-50 hover:bg-gray-100 transition-colors border border-gray-200 ${isHairStyleOptionsOpen ? 'rounded-t-lg border-b-0' : 'rounded-lg'}`}
                            aria-expanded={isHairStyleOptionsOpen}
                            aria-controls="hairstyle-options"
                        >
                            <span className="font-medium text-gray-700 text-sm">Bước 3: Chọn kiểu tóc</span>
                            <ChevronDownIcon className={`h-5 w-5 text-gray-600 transition-transform duration-300 ${isHairStyleOptionsOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {isHairStyleOptionsOpen && (
                             <div id="hairstyle-options" className="p-4 bg-white border border-t-0 border-gray-200 rounded-b-lg">
                                <div className="grid grid-cols-2 sm:grid-cols-2 gap-3">
                                    {Object.entries(hairStyles).map(([key, name]) => (
                                        <button
                                            key={key}
                                            onClick={() => setHairStyle(key as any)}
                                            className={`w-full text-center px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-200 border-2 ${hairStyle === key ? 'bg-sky-600 text-white border-sky-700 shadow-md' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'}`}
                                        >
                                            {name}
                                        </button>
                                    ))}
                                </div>
                             </div>
                        )}
                    </div>
                    
                    <div className="rounded-lg shadow-sm">
                        <button
                            onClick={() => faceDetected !== false && setIsFaceOptionsOpen(!isFaceOptionsOpen)}
                            disabled={faceDetected === false}
                            className={`w-full flex justify-between items-center p-3 text-left bg-gray-50 transition-colors border border-gray-200 ${isFaceOptionsOpen ? 'rounded-t-lg border-b-0' : 'rounded-lg'} ${faceDetected !== false ? 'hover:bg-gray-100' : 'opacity-60 cursor-not-allowed'}`}
                            aria-expanded={isFaceOptionsOpen}
                            aria-controls="face-options"
                        >
                            <div className="font-medium text-gray-700 text-sm flex items-center gap-2">
                                <span>Bước 4: Chỉnh sửa khuôn mặt</span>
                                {isDetectingFaces && (
                                    <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" role="status" aria-label="Đang phát hiện khuôn mặt"></div>
                                )}
                                {faceDetected === true && (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor" aria-label="Đã phát hiện khuôn mặt">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                )}
                                {faceDetected === false && (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor" aria-label="Không phát hiện được khuôn mặt">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                    </svg>
                                )}
                            </div>
                            <ChevronDownIcon className={`h-5 w-5 text-gray-600 transition-transform duration-300 ${isFaceOptionsOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {isFaceOptionsOpen && faceDetected !== false && (
                             <div id="face-options" className="p-4 bg-white border border-t-0 border-gray-200 rounded-b-lg">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {Object.entries(faceOptionsMap).map(([key, name]) => (
                                        <button
                                            key={key}
                                            onClick={() => handleFaceOptionToggle(key)}
                                            className={`w-full text-center px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-200 border-2 ${faceOptions.includes(key) ? 'bg-sky-600 text-white border-sky-700 shadow-md' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'}`}
                                        >
                                            {name}
                                        </button>
                                    ))}
                                </div>
                                <div className="mt-4 pt-4 border-t border-gray-200">
                                    <label className="block text-sm font-medium text-gray-600 mb-2">Nhặt mụn AI:</label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {(Object.keys(blemishRemovalOptions) as BlemishRemoval[]).map((key) => (
                                            <button
                                                key={key}
                                                onClick={() => setBlemishRemoval(key)}
                                                className={`w-full text-center px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-200 border-2 ${blemishRemoval === key ? 'bg-sky-600 text-white border-sky-700 shadow-md' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'}`}
                                            >
                                                {blemishRemovalOptions[key]}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                 <div className="mt-4 pt-4 border-t border-gray-200">
                                    <label className="block text-sm font-medium text-gray-600 mb-2">Sửa dạng khuôn mặt:</label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {(Object.keys(faceShapeOptions) as FaceShape[]).map((key) => (
                                            <button
                                                key={key}
                                                onClick={() => setFaceShape(key)}
                                                className={`w-full text-center px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-200 border-2 ${faceShape === key ? 'bg-sky-600 text-white border-sky-700 shadow-md' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'}`}
                                            >
                                                {faceShapeOptions[key]}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="mt-4 pt-4 border-t border-gray-200">
                                    <label className="block text-sm font-medium text-gray-600 mb-2">Làm mịn da AI:</label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {(Object.keys(skinSmoothingOptions) as SkinSmoothing[]).map((key) => (
                                            <button
                                                key={key}
                                                onClick={() => setSkinSmoothing(key)}
                                                className={`w-full text-center px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-200 border-2 ${skinSmoothing === key ? 'bg-sky-600 text-white border-sky-700 shadow-md' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'}`}
                                            >
                                                {skinSmoothingOptions[key]}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="mt-4 pt-4 border-t border-gray-200">
                                    <label className="block text-sm font-medium text-gray-600 mb-2">Màu mắt:</label>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                        {Object.entries(eyeColors).map(([key, name]) => (
                                            <button
                                                key={key}
                                                onClick={() => setEyeColor(key)}
                                                className={`w-full text-center px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-200 border-2 ${eyeColor === key ? 'bg-sky-600 text-white border-sky-700 shadow-md' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'}`}
                                            >
                                                {name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                {faceDetected === true && (
                                    <p className="text-xs text-green-700 mt-3">Gợi ý: Đã phát hiện khuôn mặt, bạn có thể chọn các tùy chọn làm đẹp.</p>
                                )}
                             </div>
                        )}
                         {faceDetected === false && (
                            <div className="p-3 bg-white border border-t-0 border-gray-200 rounded-b-lg text-sm text-red-800 bg-red-50">
                               Không phát hiện thấy khuôn mặt nào. Các tùy chọn chỉnh sửa khuôn mặt đã bị vô hiệu hóa.
                            </div>
                        )}
                    </div>

                    <div className="rounded-lg shadow-sm">
                        <button
                            onClick={() => setIsOutfitOptionsOpen(!isOutfitOptionsOpen)}
                            className={`w-full flex justify-between items-center p-3 text-left bg-gray-50 hover:bg-gray-100 transition-colors border border-gray-200 ${isOutfitOptionsOpen ? 'rounded-t-lg border-b-0' : 'rounded-lg'}`}
                            aria-expanded={isOutfitOptionsOpen}
                            aria-controls="outfit-options"
                        >
                            <span className="font-medium text-gray-700 text-sm">Bước 5: Chọn trang phục</span>
                            <ChevronDownIcon className={`h-5 w-5 text-gray-600 transition-transform duration-300 ${isOutfitOptionsOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {isOutfitOptionsOpen && (
                            <div id="outfit-options" className="p-4 bg-white border border-t-0 border-gray-200 rounded-b-lg">
                                <div className="flex items-center gap-3 mb-4">
                                    <button
                                        onClick={() => { setGender('male'); setOutfit(null); }}
                                        className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all duration-200 border-2 ${gender === 'male' ? 'bg-sky-600 text-white border-sky-700 shadow-md' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'}`}
                                    >
                                        Nam
                                    </button>
                                    <button
                                        onClick={() => { setGender('female'); setOutfit(null); }}
                                        className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all duration-200 border-2 ${gender === 'female' ? 'bg-sky-600 text-white border-sky-700 shadow-md' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'}`}
                                    >
                                        Nữ
                                    </button>
                                </div>

                                {gender && (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                        {(gender === 'male' ? Object.entries(maleOutfits) : Object.entries(femaleOutfits)).map(([key, name]) => (
                                            <button
                                                key={key}
                                                onClick={() => setOutfit(key)}
                                                className={`w-full text-center px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-200 border-2 ${outfit === key ? 'bg-sky-600 text-white border-sky-700 shadow-md' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'}`}
                                            >
                                                {name}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </ImageProcessor>
        </div>
    );
};

export default IdPhotoEditor;