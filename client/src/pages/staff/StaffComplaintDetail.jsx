import { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { complaintService, staffService } from '../../services/services';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Upload, X, ArrowLeft, Image as ImageIcon, MapPin, AlertCircle, Clock, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';

const StaffComplaintDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);
  
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [proofImages, setProofImages] = useState([]);

  const { data, isLoading } = useQuery({
    queryKey: ['complaint', id],
    queryFn: () => complaintService.getOne(id),
  });

  const complaint = data?.complaint;

  const acceptMutation = useMutation({
    mutationFn: () => staffService.acceptComplaint(id),
    onSuccess: () => {
      toast.success('Work accepted successfully');
      queryClient.invalidateQueries(['complaint', id]);
      queryClient.invalidateQueries(['staffComplaints']);
    },
    onError: (err) => toast.error(err.message || 'Failed to accept work')
  });

  const startMutation = useMutation({
    mutationFn: () => staffService.startWork(id),
    onSuccess: () => {
      toast.success('Work started successfully');
      queryClient.invalidateQueries(['complaint', id]);
      queryClient.invalidateQueries(['staffComplaints']);
    },
    onError: (err) => toast.error(err.message || 'Failed to start work')
  });

  const completeMutation = useMutation({
    mutationFn: (formData) => staffService.completeWork(id, formData),
    onSuccess: () => {
      toast.success('Work marked as completed');
      queryClient.invalidateQueries(['complaint', id]);
      queryClient.invalidateQueries(['staffComplaints']);
      navigate('/staff/complaints');
    },
    onError: (err) => toast.error(err.message || 'Failed to complete work')
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
      </div>
    );
  }

  if (!complaint) return <div>Complaint not found</div>;

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (validFiles.length !== files.length) {
      toast.error('Only image files are allowed for proofs');
    }
    
    if (proofImages.length + validFiles.length > 5) {
      toast.error('Maximum 5 proof images allowed');
      return;
    }

    setProofImages(prev => [...prev, ...validFiles]);
  };

  const removeFile = (index) => {
    setProofImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleComplete = (e) => {
    e.preventDefault();
    if (!resolutionNotes.trim()) {
      toast.error('Resolution notes are required');
      return;
    }
    
    const formData = new FormData();
    formData.append('resolutionNotes', resolutionNotes);
    proofImages.forEach(file => {
      formData.append('proofImages', file);
    });

    completeMutation.mutate(formData);
  };

  const isAssigned = complaint.status === 'Assigned';
  const isAccepted = complaint.status === 'Accepted';
  const isInProgress = complaint.status === 'In Progress';
  const isDone = ['Completed', 'Verified', 'Resolved', 'Closed'].includes(complaint.status);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="btn btn-ghost btn-icon">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            {complaint.title}
            <span className="text-sm font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-400">
              {complaint.complaintId}
            </span>
          </h1>
          <p className="text-muted text-sm mt-1 flex items-center gap-4">
            <span className="flex items-center gap-1"><MapPin size={14} /> {complaint.location}</span>
            <span className="flex items-center gap-1"><AlertCircle size={14} /> Priority: {complaint.priority}</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="card p-6">
            <h2 className="text-xl font-bold mb-4">Complaint Description</h2>
            <p className="text-gray-300 leading-relaxed whitespace-pre-wrap bg-white/5 p-4 rounded-xl">
              {complaint.description}
            </p>

            {complaint.images?.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-muted mb-3 uppercase">Attached Images</h3>
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {complaint.images.map((img, i) => (
                    <a key={i} href={img.url} target="_blank" rel="noopener noreferrer" className="flex-shrink-0">
                      <img src={img.url} alt="attachment" className="h-32 w-48 object-cover rounded-lg border border-white/10 hover:border-indigo-500 transition-colors" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {!isDone && (
            <div className="card p-6 border-l-4 border-indigo-500">
              <h2 className="text-xl font-bold mb-4">Execute Work</h2>
              
              {isAssigned && (
                <div className="text-center py-6">
                  <p className="text-muted mb-4">You have been assigned to this complaint. Please accept the work to proceed.</p>
                  <button 
                    onClick={() => acceptMutation.mutate()} 
                    disabled={acceptMutation.isPending}
                    className="btn btn-primary btn-lg"
                  >
                    {acceptMutation.isPending ? 'Accepting...' : 'Accept Assignment'}
                  </button>
                </div>
              )}

              {isAccepted && (
                <div className="text-center py-6">
                  <p className="text-muted mb-4">You have accepted this assignment. Start the timer when you begin working.</p>
                  <button 
                    onClick={() => startMutation.mutate()} 
                    disabled={startMutation.isPending}
                    className="btn btn-primary btn-lg"
                  >
                    <Clock className="mr-2" size={20} />
                    {startMutation.isPending ? 'Starting...' : 'Start Work Now'}
                  </button>
                </div>
              )}

              {isInProgress && (
                <form onSubmit={handleComplete} className="space-y-6">
                  <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-200 text-sm mb-4">
                    <p className="flex items-center gap-2"><Clock size={16}/> Work is currently marked as IN PROGRESS.</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Resolution Notes <span className="text-red-400">*</span></label>
                    <textarea 
                      className="input min-h-[120px]"
                      placeholder="Describe the actions taken to resolve the issue..."
                      value={resolutionNotes}
                      onChange={(e) => setResolutionNotes(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Proof of Completion (Images)</label>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      multiple 
                      accept="image/*"
                      onChange={handleFileSelect}
                    />
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 hover:bg-white/5 transition-all"
                    >
                      <Upload className="mx-auto mb-3 text-muted" size={32} />
                      <p className="font-medium">Click to upload proof images</p>
                      <p className="text-sm text-muted mt-1">Up to 5 images</p>
                    </div>

                    {proofImages.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-3">
                        {proofImages.map((file, i) => (
                          <div key={i} className="relative w-24 h-24 rounded-lg overflow-hidden border border-white/20">
                            <img src={URL.createObjectURL(file)} alt="preview" className="w-full h-full object-cover" />
                            <button 
                              type="button"
                              onClick={() => removeFile(i)}
                              className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end pt-4 border-t border-white/10">
                    <button 
                      type="submit" 
                      disabled={completeMutation.isPending || !resolutionNotes.trim()}
                      className="btn btn-primary"
                    >
                      <CheckCircle2 className="mr-2" size={20} />
                      {completeMutation.isPending ? 'Submitting...' : 'Complete Work & Submit for Verification'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {isDone && (
            <div className="card p-6 border-l-4 border-green-500 bg-green-500/5">
              <h2 className="text-xl font-bold mb-2 text-green-400 flex items-center gap-2">
                <CheckCircle2 /> Work Completed
              </h2>
              <p className="text-muted">This complaint has been marked as completed. Pending admin verification.</p>
              
              <div className="mt-4 p-4 rounded-xl bg-white/5">
                <h3 className="font-semibold text-sm mb-2 uppercase text-muted">Your Resolution Notes</h3>
                <p className="whitespace-pre-wrap">{complaint.resolutionNotes}</p>
              </div>

              {complaint.completionProofImages?.length > 0 && (
                 <div className="mt-4">
                  <h3 className="text-sm font-semibold text-muted mb-3 uppercase">Proof Images</h3>
                  <div className="flex gap-3 overflow-x-auto pb-2">
                    {complaint.completionProofImages.map((img, i) => (
                      <a key={i} href={img.url} target="_blank" rel="noopener noreferrer" className="flex-shrink-0">
                        <img src={img.url} alt="proof" className="h-24 w-32 object-cover rounded-lg border border-white/10 hover:border-green-500 transition-colors" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="card p-5">
             <h3 className="font-bold text-lg mb-4">Work Status</h3>
             <div className="space-y-4">
                <div>
                  <p className="text-xs text-muted uppercase tracking-wider mb-1">Current Status</p>
                  <p className="font-semibold text-lg text-indigo-400">{complaint.status}</p>
                </div>
                <div>
                  <p className="text-xs text-muted uppercase tracking-wider mb-1">Submitted By</p>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white text-sm font-bold">
                      {complaint.submittedBy?.name?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{complaint.submittedBy?.name}</p>
                      <p className="text-xs text-muted">{complaint.submittedBy?.phone || 'No phone'}</p>
                    </div>
                  </div>
                </div>
                {complaint.assignedAt && (
                   <div>
                    <p className="text-xs text-muted uppercase tracking-wider mb-1">Assigned On</p>
                    <p className="text-sm">{format(new Date(complaint.assignedAt), 'PPp')}</p>
                   </div>
                )}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffComplaintDetail;
