import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Upload, X, FileText, Image, AlertCircle, Sparkles,
  MapPin, Tag, Building2, ArrowRight, ChevronLeft
} from 'lucide-react';
import { complaintService, publicService } from '../../services/services';
import { analyzeComplaint, getCategoryIcon } from '../../utils/helpers';
import toast from 'react-hot-toast';

const CATEGORIES = ['Water', 'Electricity', 'Internet', 'Roads', 'Sanitation', 'Transport', 'Hostel', 'Academic', 'Technical', 'Other'];
const URGENCY_LEVELS = ['Low', 'Medium', 'High', 'Critical'];

const schema = z.object({
  title: z.string().min(10, 'Title must be at least 10 characters').max(200),
  description: z.string().min(20, 'Description must be at least 20 characters').max(5000),
  category: z.string().min(1, 'Please select a category'),
  department: z.string().min(1, 'Please select a department'),
  location: z.string().min(3, 'Please provide a location'),
  urgency: z.string().min(1, 'Please select urgency level'),
});

const SubmitComplaint = () => {
  const navigate = useNavigate();
  const [files, setFiles] = useState([]);
  const [aiSuggestion, setAiSuggestion] = useState(null);
  const [showAiSuggestion, setShowAiSuggestion] = useState(false);
  const [step, setStep] = useState(1);
  const fileInputRef = useRef(null);
  const analysisTimeout = useRef(null);

  const { data: deptData } = useQuery({
    queryKey: ['departments-public'],
    queryFn: publicService.getDepartments,
    staleTime: 5 * 60 * 1000,
  });
  const departments = deptData?.departments || [];

  const { register, handleSubmit, watch, setValue, control, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { urgency: 'Medium' },
  });

  const title = watch('title', '');
  const description = watch('description', '');

  // AI analysis on text change
  useEffect(() => {
    if (analysisTimeout.current) clearTimeout(analysisTimeout.current);
    const combined = `${title} ${description}`;
    if (combined.trim().length > 20) {
      analysisTimeout.current = setTimeout(() => {
        const suggestion = analyzeComplaint(combined);
        setAiSuggestion(suggestion);
        setShowAiSuggestion(true);
      }, 800);
    } else {
      setAiSuggestion(null);
      setShowAiSuggestion(false);
    }
    return () => clearTimeout(analysisTimeout.current);
  }, [title, description]);

  const applyAiSuggestion = () => {
    if (!aiSuggestion) return;
    setValue('category', aiSuggestion.suggestedCategory);
    setValue('urgency', aiSuggestion.suggestedUrgency);

    // Auto-select department by name
    const dept = departments.find((d) =>
      d.name.toLowerCase().includes(aiSuggestion.suggestedDepartment?.toLowerCase().split(' ')[0] || '')
    );
    if (dept) setValue('department', dept._id);

    toast.success('AI suggestions applied!');
    setShowAiSuggestion(false);
  };

  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files);
    if (files.length + newFiles.length > 10) {
      toast.error('Maximum 10 files allowed');
      return;
    }
    setFiles((prev) => [...prev, ...newFiles]);
  };

  const removeFile = (index) => {
    const file = files[index];
    if (file && file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      URL.revokeObjectURL(url);
    }
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const submitMutation = useMutation({
    mutationFn: (formData) => complaintService.submit(formData),
    onSuccess: (data) => {
      toast.success(`Complaint ${data.complaint.complaintId} submitted successfully!`);
      navigate(`/complaints/${data.complaint._id}`);
    },
    onError: (err) => toast.error(err.message || 'Failed to submit complaint'),
  });

  const onSubmit = (data) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, val]) => formData.append(key, val));
    files.forEach((file) => formData.append('attachments', file));
    submitMutation.mutate(formData);
  };

  const urgencyColors = {
    Low: '#22c55e', Medium: '#f59e0b', High: '#f97316', Critical: '#ef4444',
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="btn btn-ghost btn-icon">
          <ChevronLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold">Submit a Complaint</h1>
          <p className="text-muted text-sm">Describe your issue and we'll route it to the right department</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Title */}
        <div className="card p-6">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <FileText size={18} style={{ color: 'rgb(var(--color-primary))' }} /> Complaint Details
          </h2>

          <div className="form-group">
            <label className="label">Complaint Title *</label>
            <input
              {...register('title')}
              type="text"
              placeholder="Brief, clear title describing the issue (min 10 characters)"
              className={`input ${errors.title ? 'input-error' : ''}`}
            />
            {errors.title && <p className="error-text">{errors.title.message}</p>}
          </div>

          <div className="form-group">
            <label className="label">Detailed Description *</label>
            <textarea
              {...register('description')}
              rows={5}
              placeholder="Provide as much detail as possible about the issue. Include when it started, how it affects you, and any relevant details..."
              className={`input resize-none ${errors.description ? 'input-error' : ''}`}
            />
            <div className="flex items-center justify-between mt-1">
              {errors.description ? (
                <p className="error-text">{errors.description.message}</p>
              ) : (
                <span />
              )}
              <span className="text-xs text-muted">{description.length}/5000</span>
            </div>
          </div>
        </div>

        {/* AI Suggestion Banner */}
        <AnimatePresence>
          {showAiSuggestion && aiSuggestion && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="rounded-xl p-4"
              style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)' }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(99,102,241,0.15)' }}>
                    <Sparkles size={16} style={{ color: 'rgb(99,102,241)' }} />
                  </div>
                  <div>
                    <p className="font-semibold text-sm" style={{ color: 'rgb(99,102,241)' }}>
                      AI Suggestion ({aiSuggestion.confidence}% confidence)
                    </p>
                    <p className="text-xs text-muted mt-1">
                      Category: <strong>{aiSuggestion.suggestedCategory}</strong> {getCategoryIcon(aiSuggestion.suggestedCategory)} ·
                      Urgency: <strong>{aiSuggestion.suggestedUrgency}</strong> ·
                      Department: <strong>{aiSuggestion.suggestedDepartment}</strong>
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={applyAiSuggestion} className="btn btn-sm" style={{ background: 'rgb(99,102,241)', color: 'white' }}>
                    Apply
                  </button>
                  <button type="button" onClick={() => setShowAiSuggestion(false)} className="btn btn-ghost btn-icon btn-sm">
                    <X size={14} />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Category & Department */}
        <div className="card p-6">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <Tag size={18} style={{ color: 'rgb(var(--color-primary))' }} /> Classification
          </h2>

          <div className="grid sm:grid-cols-2 gap-4">
            {/* Category */}
            <div className="form-group">
              <label className="label">Category *</label>
              <div className="grid grid-cols-2 gap-2">
                {CATEGORIES.map((cat) => {
                  const current = watch('category');
                  const isSelected = current === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setValue('category', cat)}
                      className={`flex items-center gap-2 p-2.5 rounded-xl text-sm transition-all border ${
                        isSelected ? 'border-indigo-400' : 'border-default'
                      }`}
                      style={{
                        background: isSelected ? 'rgba(99,102,241,0.1)' : 'rgb(var(--bg-hover))',
                        color: isSelected ? 'rgb(99,102,241)' : 'rgb(var(--text-secondary))',
                      }}
                    >
                      <span>{getCategoryIcon(cat)}</span> {cat}
                    </button>
                  );
                })}
              </div>
              {errors.category && <p className="error-text mt-1">{errors.category.message}</p>}
            </div>

            {/* Department */}
            <div>
              <div className="form-group">
                <label className="label">Department *</label>
                <select {...register('department')} className={`input ${errors.department ? 'input-error' : ''}`}>
                  <option value="">Select department...</option>
                  {departments.map((dept) => (
                    <option key={dept._id} value={dept._id}>{dept.name}</option>
                  ))}
                </select>
                {errors.department && <p className="error-text">{errors.department.message}</p>}
              </div>

              {/* Urgency */}
              <div className="form-group">
                <label className="label">Urgency Level *</label>
                <div className="grid grid-cols-2 gap-2">
                  {URGENCY_LEVELS.map((level) => {
                    const current = watch('urgency');
                    const isSelected = current === level;
                    return (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setValue('urgency', level)}
                        className={`p-2.5 rounded-xl text-sm font-medium transition-all border ${
                          isSelected ? '' : 'border-default'
                        }`}
                        style={{
                          background: isSelected ? `${urgencyColors[level]}18` : 'rgb(var(--bg-hover))',
                          color: isSelected ? urgencyColors[level] : 'rgb(var(--text-secondary))',
                          borderColor: isSelected ? urgencyColors[level] + '44' : undefined,
                        }}
                      >
                        {level}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Location */}
              <div className="form-group">
                <label className="label">Location *</label>
                <div className="relative">
                  <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                  <input
                    {...register('location')}
                    type="text"
                    placeholder="Block A, Sector 5, Near Gate 3..."
                    className={`input pl-10 ${errors.location ? 'input-error' : ''}`}
                  />
                </div>
                {errors.location && <p className="error-text">{errors.location.message}</p>}
              </div>
            </div>
          </div>
        </div>

        {/* Attachments */}
        <div className="card p-6">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <Upload size={18} style={{ color: 'rgb(var(--color-primary))' }} /> Attachments (Optional)
          </h2>

          <div
            className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all hover:border-indigo-400 hover:bg-indigo-50/5"
            style={{ borderColor: 'rgb(var(--border-r), var(--border-g), var(--border-b))' }}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const dropped = Array.from(e.dataTransfer.files);
              setFiles((prev) => [...prev, ...dropped].slice(0, 10));
            }}
          >
            <Upload size={32} style={{ color: 'rgb(var(--text-muted))' }} className="mx-auto mb-3" />
            <p className="font-medium text-sm mb-1">Drop files here or click to upload</p>
            <p className="text-xs text-muted">Images, PDFs, DOC files — max 10MB each, up to 10 files</p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,.pdf,.doc,.docx"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {/* File previews */}
          {files.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
              {files.map((file, i) => {
                const isImage = file.type.startsWith('image/');
                const url = URL.createObjectURL(file);
                return (
                  <div
                    key={i}
                    className="relative rounded-xl overflow-hidden group"
                    style={{ background: 'rgb(var(--bg-hover))', border: '1px solid rgb(var(--border-r), var(--border-g), var(--border-b))' }}
                  >
                    {isImage ? (
                      <img src={url} alt="" className="w-full h-24 object-cover" />
                    ) : (
                      <div className="h-24 flex flex-col items-center justify-center">
                        <FileText size={24} style={{ color: 'rgb(var(--text-muted))' }} />
                        <span className="text-xs text-muted mt-1 px-2 text-center truncate w-full">{file.name}</span>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => removeFile(i)}
                      className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full flex items-center justify-center text-white opacity-80 hover:opacity-100"
                      style={{ background: '#ef4444' }}
                    >
                      <X size={12} />
                    </button>
                    <div className="px-2 py-1">
                      <p className="text-xs text-muted truncate">{file.name}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Submit */}
        <div className="flex gap-3 justify-end">
          <button type="button" onClick={() => navigate(-1)} className="btn btn-secondary">
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitMutation.isPending}
            className="btn btn-primary btn-lg"
          >
            {submitMutation.isPending ? (
              <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3" />
                <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="3" strokeLinecap="round" />
              </svg>
            ) : (
              <><ArrowRight size={18} /> Submit Complaint</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SubmitComplaint;
