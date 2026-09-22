import React, { useRef, useState } from 'react';
import {
  Upload,
  Box,
  RotateCw,
  Eye,
  EyeOff,
  Trash2,
  Maximize2,
  FileCode,
  Layers,
  Sparkles,
  Sliders,
  Check,
  AlertCircle,
} from 'lucide-react';
import * as THREE from 'three';
import { UserUploadedModel } from '../types';
import { parseModelFile, createPresetResearchModel } from '../simulation/modelLoader';

interface ModelUploadManagerProps {
  models: UserUploadedModel[];
  onAddModel: (model: UserUploadedModel, object3D: THREE.Group) => void;
  onUpdateModel: (id: string, updates: Partial<UserUploadedModel>) => void;
  onRemoveModel: (id: string) => void;
  onSelectModel: (id: string) => void;
  selectedModelId: string | null;
}

export const ModelUploadManager: React.FC<ModelUploadManagerProps> = ({
  models,
  onAddModel,
  onUpdateModel,
  onRemoveModel,
  onSelectModel,
  selectedModelId,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setErrorMessage(null);

    try {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      if (!['obj', 'fbx'].includes(ext)) {
        throw new Error('Please upload a 3D model in .OBJ or .FBX format.');
      }

      const result = await parseModelFile(file);
      const modelId = `model_${Date.now()}`;
      const newModel: UserUploadedModel = {
        id: modelId,
        name: file.name.replace(/\.[^/.]+$/, ''),
        format: ext as 'obj' | 'fbx',
        scale: 1.0,
        position: [-3.5 + (Math.random() - 0.5) * 4, 1.2, (Math.random() - 0.5) * 4],
        rotation: [0, 0, 0],
        visible: true,
        wireframe: false,
        color: '#38bdf8',
        isPhysicsActive: true,
        mass: 5.0,
        vertexCount: result.vertexCount,
        triangleCount: result.triangleCount,
      };

      onAddModel(newModel, result.group);
      onSelectModel(modelId);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to parse 3D model file.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleAddPreset = (type: 'oae_buoy' | 'sensor_pod' | 'diffuser_ring' | 'sample_cube') => {
    const group = createPresetResearchModel(type);
    const titles: Record<string, string> = {
      oae_buoy: 'Research Spar Buoy',
      sensor_pod: 'Sensor Micro-Glider',
      diffuser_ring: 'Vortex Slurry Diffuser',
      sample_cube: 'Calcite Mineral Core',
    };
    const modelId = `preset_${Date.now()}`;
    const newModel: UserUploadedModel = {
      id: modelId,
      name: titles[type],
      format: 'obj',
      scale: 1.0,
      position: [-3.5 + (Math.random() - 0.5) * 5, 1.2, (Math.random() - 0.5) * 5],
      rotation: [0, 0, 0],
      visible: true,
      wireframe: false,
      color: type === 'diffuser_ring' ? '#06b6d4' : type === 'sample_cube' ? '#a855f7' : '#f59e0b',
      isPhysicsActive: true,
      mass: type === 'diffuser_ring' ? 12 : 6,
      vertexCount: 384,
      triangleCount: 512,
    };

    onAddModel(newModel, group);
    onSelectModel(modelId);
  };

  const selectedModel = models.find((m) => m.id === selectedModelId);

  return (
    <div className="flex flex-col gap-3 text-slate-200 text-xs">
      {/* Upload Zone */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-3.5 flex flex-col items-center justify-center text-center cursor-pointer transition ${
          isUploading
            ? 'border-cyan-500 bg-cyan-950/30 text-cyan-300'
            : 'border-slate-700 hover:border-cyan-400/80 bg-slate-900/60 hover:bg-slate-900'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".obj,.fbx"
          onChange={handleFileUpload}
          className="hidden"
        />
        <Upload className="w-5 h-5 text-cyan-400 mb-1.5" />
        <span className="font-semibold text-slate-200">
          {isUploading ? 'Parsing 3D Geometry...' : 'Upload 3D Model (.OBJ / .FBX)'}
        </span>
        <span className="text-[10px] text-slate-400 mt-0.5">
          Drop custom sensors, diffusers, or hulls into the basin
        </span>
      </div>

      {errorMessage && (
        <div className="p-2 rounded bg-rose-950/70 border border-rose-500/60 text-rose-200 flex items-start gap-1.5 text-[11px]">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Preset Quick-Spawn Buttons */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] font-mono uppercase text-slate-400">Quick-Spawn Research Assets:</span>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={() => handleAddPreset('oae_buoy')}
            className="p-1.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-left font-mono text-[11px] flex items-center gap-1.5 transition"
          >
            <Box className="w-3 h-3 text-amber-400" />
            Spar Buoy
          </button>
          <button
            onClick={() => handleAddPreset('sensor_pod')}
            className="p-1.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-left font-mono text-[11px] flex items-center gap-1.5 transition"
          >
            <Box className="w-3 h-3 text-emerald-400" />
            Micro-Glider
          </button>
          <button
            onClick={() => handleAddPreset('diffuser_ring')}
            className="p-1.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-left font-mono text-[11px] flex items-center gap-1.5 transition"
          >
            <Box className="w-3 h-3 text-cyan-400" />
            Vortex Diffuser
          </button>
          <button
            onClick={() => handleAddPreset('sample_cube')}
            className="p-1.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-left font-mono text-[11px] flex items-center gap-1.5 transition"
          >
            <Box className="w-3 h-3 text-purple-400" />
            Mineral Core
          </button>
        </div>
      </div>

      {/* Uploaded Models List */}
      {models.length > 0 && (
        <div className="flex flex-col gap-1.5 mt-1 border-t border-slate-800/80 pt-2">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span className="font-semibold uppercase tracking-wider font-mono">Rendered Assets ({models.length})</span>
          </div>

          <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto pr-0.5">
            {models.map((m) => {
              const isSelected = m.id === selectedModelId;
              return (
                <div
                  key={m.id}
                  onClick={() => onSelectModel(m.id)}
                  className={`p-2 rounded-lg border transition flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? 'bg-cyan-950/70 border-cyan-400 text-white'
                      : 'bg-slate-900/60 border-slate-800/90 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <Box className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <div className="truncate">
                      <div className="font-semibold truncate">{m.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {m.triangleCount} tris • {m.mass}kg • {m.isPhysicsActive ? 'Physics ON' : 'Fixed'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => onUpdateModel(m.id, { visible: !m.visible })}
                      className="p-1 text-slate-400 hover:text-slate-200"
                      title={m.visible ? 'Hide Model' : 'Show Model'}
                    >
                      {m.visible ? <Eye className="w-3 h-3 text-emerald-400" /> : <EyeOff className="w-3 h-3 text-slate-500" />}
                    </button>
                    <button
                      onClick={() => onRemoveModel(m.id)}
                      className="p-1 text-slate-400 hover:text-rose-400"
                      title="Delete Model"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Selected Model Inspector & Transform Controls */}
      {selectedModel && (
        <div className="flex flex-col gap-2.5 p-2.5 rounded-lg bg-slate-900/90 border border-cyan-500/40 mt-1">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1">
            <span className="font-mono font-bold text-[11px] text-cyan-300">
              INSPECT: {selectedModel.name}
            </span>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
              .{selectedModel.format.toUpperCase()}
            </span>
          </div>

          {/* Scale Slider */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-300">Uniform Scale</span>
              <span className="font-mono text-cyan-400">{selectedModel.scale.toFixed(2)}x</span>
            </div>
            <input
              type="range"
              min="0.2"
              max="4.0"
              step="0.1"
              value={selectedModel.scale}
              onChange={(e) => onUpdateModel(selectedModel.id, { scale: parseFloat(e.target.value) })}
              className="w-full accent-cyan-400 h-1 bg-slate-800 rounded appearance-none cursor-pointer"
            />
          </div>

          {/* Mass Slider */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-300">Object Mass</span>
              <span className="font-mono text-cyan-400">{selectedModel.mass} kg</span>
            </div>
            <input
              type="range"
              min="1"
              max="50"
              step="1"
              value={selectedModel.mass}
              onChange={(e) => onUpdateModel(selectedModel.id, { mass: parseFloat(e.target.value) })}
              className="w-full accent-cyan-400 h-1 bg-slate-800 rounded appearance-none cursor-pointer"
            />
          </div>

          {/* Physics & Render Toggles */}
          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800">
            <button
              onClick={() => onUpdateModel(selectedModel.id, { isPhysicsActive: !selectedModel.isPhysicsActive })}
              className={`p-1.5 rounded border text-[10px] font-mono flex items-center justify-center gap-1.5 transition ${
                selectedModel.isPhysicsActive
                  ? 'bg-emerald-950/70 border-emerald-500 text-emerald-300'
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
            >
              <Check className={`w-3 h-3 ${selectedModel.isPhysicsActive ? 'opacity-100' : 'opacity-0'}`} />
              Physics Dynamics
            </button>

            <button
              onClick={() => onUpdateModel(selectedModel.id, { wireframe: !selectedModel.wireframe })}
              className={`p-1.5 rounded border text-[10px] font-mono flex items-center justify-center gap-1.5 transition ${
                selectedModel.wireframe
                  ? 'bg-cyan-950/70 border-cyan-500 text-cyan-300'
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
            >
              <FileCode className="w-3 h-3 text-cyan-400" />
              Wireframe
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
