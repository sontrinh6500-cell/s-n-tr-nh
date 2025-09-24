

import React, { useState, useMemo, useEffect } from 'react';
import ImageProcessor from '../components/ImageProcessor';
import { ChevronDownIcon } from '../components/icons/Icons';

type WrinkleReductionLevel = 'none' | 'light' | 'moderate';

interface RetouchOptions {
    skinSmoothing: number;
    eyeClarity: number;
    clothingTexture: number;
    wrinkleReduction: WrinkleReductionLevel;
    blemishRemoval: string;
}

const PhotoRestorer: React.FC = () => {
    const [retouchOptions, setRetouchOptions] = useState<RetouchOptions>({
        skinSmoothing: 0.4,
        eyeClarity: 0.2,
        clothingTexture: 0.2,
        wrinkleReduction: 'moderate',
        blemishRemoval: 'lightly reduce temporary blemishes only',
    });
    
    const [isRetouchOptionsOpen, setIsRetouchOptionsOpen] = useState(true);
    const [isPromptOptionsOpen, setIsPromptOptionsOpen] = useState(false);

    const generatedPrompt = useMemo(() => {
      const promptObj = {
          "version": "1.0", 
          "task": "image_edit", 
          "notes": "Edit foto menjadi potret studio kelas profesional setara Canon EOS R5. Pertahankan wajah & pose asli.", 
          "input_image": "REPLACE_WITH_IMAGE_ID_OR_PATH", 
          "camera_emulation": { 
            "brand_model": "Canon EOS R5", 
            "lens": "50mm f/1.8 (standard prime, sedikit lebih luas dari 85mm)", 
            "look": "ultra sharp, rich micro-contrast, natural color science" 
          }, 
          "composition": { 
            "framing": "three-quarter body (from mid-thigh up)", 
            "arms": "both arms sepenuhnya terlihat", 
            "orientation": "portrait", 
            "crop_policy": "do_not_crop_face_or_hands", 
            "keep_pose": true, 
            "zoom": "slight zoom-out for wider context" 
          }, 
          "subject_constraints": { 
            "keep_identity": true, 
            "lock_features": ["eyes", "nose", "lips", "eyebrows", "jawline", "face_shape"], 
            "expression_policy": "preserve_original" 
          }, 
          "retouching": { 
            "skin": { 
              "tone": "keep original color", 
              "finish": "smooth, healthy, radiant", 
              "texture": "retain fine pores; avoid plastic look", 
              "blemishes": retouchOptions.blemishRemoval, 
              "frequency_separation_strength": retouchOptions.skinSmoothing, 
              "clarity_microcontrast": 0.15 
            }, 
            "hair": { 
              "finish": "clean, neat, shiny", 
              "flyaways": "reduce but keep natural strands" 
            }, 
            "eyes": { 
              "whites_desaturation": 0.1, 
              "iris_clarity": retouchOptions.eyeClarity, 
              "avoid_overwhitening": true 
            }, 
            "teeth": { 
              "natural_whiten": 0.08, 
              "avoid_pure_white": true 
            },
            "clothing": { 
              "policy": "upgrade quality while keeping same/similar style, cut, and color", 
              "fabric_look": "premium, fine weave, crisp edges", 
              "wrinkle_reduction": retouchOptions.wrinkleReduction, 
              "texture_enhancement": retouchOptions.clothingTexture 
            }
          },
          "lighting": { 
            "setup": "bright, soft, even front light", 
            "key": "beauty dish or ring light straight-on", 
            "fill": "broad soft fill to remove harsh shadows", 
            "shadow_control": "minimal, no deep shadows", 
            "specular_highlights": "subtle, flattering", 
            "white_balance": "neutral daylight", 
            "exposure_target": "ETTR without clipping" 
          }, 
          "background": { 
            "type": "solid", 
            "color": "navy blue (#0f2a4a)", 
            "environment": "clean professional photo studio", 
            "gradient": "very subtle center vignette", 
            "separation": "gentle rim lift if needed" 
          }, 
          "color_tone": { 
            "overall": "natural, true-to-life skin tones", 
            "saturation": "moderate", 
            "contrast": "medium with soft roll-off", 
            "vibrance": 0.1 
          }, 
          "detail_sharpness": { 
            "method": "edge-aware sharpening", 
            "amount": 0.35, 
            "radius": 0.8, 
            "threshold": 0.02, 
            "noise_reduction": { 
              "luminance": 0.2, 
              "chroma": 0.25, 
              "preserve_details": 0.8 
            }
          }, 
          "clean_up": { 
            "remove_noise": true, 
            "remove_artifacts": true, 
            "banding_fix_on_background": true 
          },
          "output": { 
            "resolution": "Enhance to the highest possible detail and clarity, at least doubling the original resolution while strictly preserving the original aspect ratio. The image must be sharp and clear, free of digital artifacts.",
            "dpi": 300, 
            "format": "PNG", 
            "color_space": "sRGB IEC61966-2.1", 
            "bit_depth": "16-bit if supported, else 8-bit", 
            "background_alpha": "opaque"
          },
          "safety_bounds": { 
            "do_not": [ 
              "change face geometry or identity", 
              "change pose", 
              "alter clothing style drastically", 
              "add heavy makeup", 
              "over-smooth or plastic skin", 
              "over-sharpen halos"
            ]
          },
          "negative_prompt": [ 
            "plastic skin", 
            "over-whitened eyes/teeth", 
            "harsh shadows", 
            "color casts", 
            "halo artifacts", 
            "muddy blacks", 
            "posterization/banding", 
            "oversaturated skin", 
            "blotchy NR"
          ],
          "control_strengths": {
            "face_identity_lock": 0.95, 
            "pose_lock": 0.95, 
            "background_replace_strength": 0.9, 
            "clothes_style_lock": 0.85 
          }, 
          "metadata": { 
            "locale": "id-ID", 
            "creator": "professional photo editor style", 
            "purpose": "masterpiece studio portrait upgrade with zoom-out framing"
          }
      };
      return JSON.stringify(promptObj, null, 2);
    }, [retouchOptions]);

    const [finalPrompt, setFinalPrompt] = useState(generatedPrompt);

    useEffect(() => {
        setFinalPrompt(generatedPrompt);
    }, [generatedPrompt]);

    const wrinkleReductionOptions: { key: WrinkleReductionLevel, name: string }[] = [
        { key: 'none', name: 'Không' },
        { key: 'light', name: 'Nhẹ' },
        { key: 'moderate', name: 'Vừa phải' },
    ];

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-slate-800">Phục hồi ảnh cũ</h1>
                <p className="text-slate-600 mt-1">PHẦN MỀM ĐƯỢC PHÁT TRIỂN BỞI SƠN TRỊNH</p>
            </div>
            <ImageProcessor 
                prompt={finalPrompt}
                buttonText="Phục hồi ảnh"
            >
                <div className="space-y-4">
                    <div className="rounded-lg shadow-sm">
                        <button
                            onClick={() => setIsRetouchOptionsOpen(!isRetouchOptionsOpen)}
                            className={`w-full flex justify-between items-center p-3 text-left bg-gray-50 hover:bg-gray-100 transition-colors border border-gray-200 ${isRetouchOptionsOpen ? 'rounded-t-lg border-b-0' : 'rounded-lg'}`}
                            aria-expanded={isRetouchOptionsOpen}
                            aria-controls="retouch-options"
                        >
                            <span className="font-medium text-gray-700 text-sm">Bước 2: Tùy chọn Chỉnh sửa (Retouching)</span>
                            <ChevronDownIcon className={`h-5 w-5 text-gray-600 transition-transform duration-300 ${isRetouchOptionsOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {isRetouchOptionsOpen && (
                            <div id="retouch-options" className="p-4 bg-white border border-t-0 border-gray-200 rounded-b-lg space-y-5">
                                <div className="space-y-2">
                                    <label htmlFor="skin-smoothing-slider" className="flex justify-between text-sm font-medium text-gray-600">
                                        <span>Làm mịn da</span>
                                        <span className="font-bold text-sky-700">{retouchOptions.skinSmoothing.toFixed(2)}</span>
                                    </label>
                                    <input
                                        id="skin-smoothing-slider"
                                        type="range" min="0" max="1" step="0.05"
                                        value={retouchOptions.skinSmoothing}
                                        onChange={(e) => setRetouchOptions(prev => ({ ...prev, skinSmoothing: parseFloat(e.target.value) }))}
                                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:bg-sky-600 [&::-moz-range-thumb]:bg-sky-600"
                                    />
                                </div>
                                
                                <div className="space-y-2">
                                    <label htmlFor="eye-clarity-slider" className="flex justify-between text-sm font-medium text-gray-600">
                                        <span>Tăng cường chi tiết mắt</span>
                                        <span className="font-bold text-sky-700">{retouchOptions.eyeClarity.toFixed(2)}</span>
                                    </label>
                                    <input
                                        id="eye-clarity-slider"
                                        type="range" min="0" max="1" step="0.05"
                                        value={retouchOptions.eyeClarity}
                                        onChange={(e) => setRetouchOptions(prev => ({ ...prev, eyeClarity: parseFloat(e.target.value) }))}
                                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:bg-sky-600 [&::-moz-range-thumb]:bg-sky-600"
                                    />
                                </div>
                               
                                <div className="space-y-2">
                                    <label htmlFor="clothing-texture-slider" className="flex justify-between text-sm font-medium text-gray-600">
                                        <span>Cải thiện chất liệu vải</span>
                                        <span className="font-bold text-sky-700">{retouchOptions.clothingTexture.toFixed(2)}</span>
                                    </label>
                                    <input
                                        id="clothing-texture-slider"
                                        type="range" min="0" max="1" step="0.05"
                                        value={retouchOptions.clothingTexture}
                                        onChange={(e) => setRetouchOptions(prev => ({ ...prev, clothingTexture: parseFloat(e.target.value) }))}
                                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:bg-sky-600 [&::-moz-range-thumb]:bg-sky-600"
                                    />
                                </div>
                               
                                <div>
                                    <label className="block text-sm font-medium text-gray-600 mb-2">Giảm nếp nhăn (Vải)</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {wrinkleReductionOptions.map(({ key, name }) => (
                                            <button 
                                                key={key}
                                                onClick={() => setRetouchOptions(prev => ({...prev, wrinkleReduction: key}))} 
                                                className={`w-full text-center px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-200 border-2 ${retouchOptions.wrinkleReduction === key ? 'bg-sky-600 text-white border-sky-700 shadow-md' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'}`}
                                            >
                                                {name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="rounded-lg shadow-sm">
                        <button
                            onClick={() => setIsPromptOptionsOpen(!isPromptOptionsOpen)}
                            className={`w-full flex justify-between items-center p-3 text-left bg-gray-50 hover:bg-gray-100 transition-colors border border-gray-200 ${isPromptOptionsOpen ? 'rounded-t-lg border-b-0' : 'rounded-lg'}`}
                            aria-expanded={isPromptOptionsOpen}
                            aria-controls="prompt-options"
                        >
                            <span className="font-medium text-gray-700 text-sm">Bước 3: Tùy chỉnh Lời nhắc (Nâng cao)</span>
                            <ChevronDownIcon className={`h-5 w-5 text-gray-600 transition-transform duration-300 ${isPromptOptionsOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {isPromptOptionsOpen && (
                            <div id="prompt-options" className="p-4 bg-white border border-t-0 border-gray-200 rounded-b-lg">
                                <label htmlFor="prompt-textarea" className="block text-sm font-medium text-gray-600 mb-2">
                                    Chỉnh sửa lời nhắc JSON dưới đây để tùy chỉnh yêu cầu phục hồi ảnh của bạn:
                                </label>
                                <textarea
                                    id="prompt-textarea"
                                    value={finalPrompt}
                                    onChange={(e) => setFinalPrompt(e.target.value)}
                                    rows={8}
                                    className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 transition text-sm text-gray-700 font-mono"
                                    placeholder="Nhập lời nhắc của bạn tại đây..."
                                />
                            </div>
                        )}
                    </div>
                </div>
            </ImageProcessor>
        </div>
    );
};

export default PhotoRestorer;