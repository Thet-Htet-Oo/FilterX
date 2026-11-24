import React, { useEffect } from 'react';

// Format bytes into human-readable B, KB, MB
export const formatFileSize = (bytes) => {
  if (!bytes || isNaN(bytes)) return '0 B';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

// Return Bootstrap Icon class and color for a file name
export const getFileMeta = (fileName) => {
  if (!fileName || !fileName.includes('.')) {
    return { icon: 'bi-file-earmark', color: '#6c757d', label: 'FILE' };
  }
  const ext = fileName.substring(fileName.lastIndexOf('.')).toLowerCase();

  switch (ext) {
    case '.java':
    case '.py':
    case '.js':
    case '.jsx':
    case '.ts':
    case '.tsx':
    case '.c':
    case '.cpp':
    case '.h':
    case '.html':
    case '.css':
    case '.sql':
    case '.json':
    case '.xml':
    case '.md':
      return { icon: 'bi-file-earmark-code', color: '#0d6efd', label: ext.replace('.', '').toUpperCase() };
    case '.pdf':
      return { icon: 'bi-file-earmark-pdf', color: '#dc3545', label: 'PDF' };
    case '.zip':
    case '.tar':
    case '.gz':
    case '.rar':
    case '.7z':
      return { icon: 'bi-file-earmark-zip', color: '#ffc107', label: 'ZIP' };
    case '.doc':
    case '.docx':
      return { icon: 'bi-file-earmark-word', color: '#0dcaf0', label: 'DOC' };
    case '.xls':
    case '.xlsx':
    case '.csv':
      return { icon: 'bi-file-earmark-excel', color: '#198754', label: 'EXCEL' };
    case '.ppt':
    case '.pptx':
      return { icon: 'bi-file-earmark-ppt', color: '#fd7e14', label: 'PPT' };
    case '.txt':
      return { icon: 'bi-file-earmark-text', color: '#6c757d', label: 'TXT' };
    default:
      return { icon: 'bi-file-earmark', color: '#495057', label: ext.replace('.', '').toUpperCase() || 'FILE' };
  }
};

// Validate files against safety rules & 2 MB limit
export const validateSelectedFile = (file, isPhoto = false) => {
  const MAX_SIZE = 2 * 1024 * 1024; // 2 MB
  if (file.size > MAX_SIZE) {
    return { valid: false, error: `File "${file.name}" exceeds the 2 MB limit (${formatFileSize(file.size)}).` };
  }

  const ext = file.name.includes('.') ? file.name.substring(file.name.lastIndexOf('.')).toLowerCase() : '';
  const BLOCKED_EXTENSIONS = ['.exe', '.bat', '.cmd', '.msi', '.scr', '.vbs', '.ps1', '.com'];
  if (BLOCKED_EXTENSIONS.includes(ext)) {
    return { valid: false, error: `Executable files like "${ext}" are blocked for security reasons.` };
  }

  if (isPhoto) {
    const ALLOWED_PHOTO_EXTS = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    if (!ALLOWED_PHOTO_EXTS.includes(ext)) {
      return { valid: false, error: `Photo format not supported for "${file.name}". Supported: JPG, PNG, WEBP, GIF.` };
    }
  }

  return { valid: true };
};

// Photo Gallery Grid Component
export const AttachmentGallery = ({ attachments = [], onPhotoClick }) => {
  const photos = attachments.filter((att) => att.attachmentType === 'PHOTO');
  if (photos.length === 0) return null;

  const count = Math.min(photos.length, 3);
  return (
    <div className={`post-photo-grid grid-${count}`}>
      {photos.map((photo) => (
        <div
          key={photo.id}
          className="post-photo-item"
          onClick={() => onPhotoClick && onPhotoClick(photo.downloadUrl, photo.fileName)}
          title={`Click to view ${photo.fileName}`}
        >
          <img
            src={photo.downloadUrl}
            alt={photo.fileName}
            className="post-photo-img"
            loading="lazy"
          />
        </div>
      ))}
    </div>
  );
};

// Downloadable File List Component
export const FileList = ({ attachments = [] }) => {
  const files = attachments.filter((att) => att.attachmentType === 'FILE');
  if (files.length === 0) return null;

  return (
    <div className="post-file-list">
      {files.map((file) => {
        const meta = getFileMeta(file.fileName);
        return (
          <div key={file.id} className="post-file-card">
            <div className="post-file-info">
              <div className="post-file-icon" style={{ color: meta.color }}>
                <i className={`bi ${meta.icon}`}></i>
              </div>
              <div className="post-file-details">
                <span className="post-file-name" title={file.fileName}>
                  {file.fileName}
                </span>
                <span className="post-file-size">
                  {formatFileSize(file.fileSize)} • {meta.label}
                </span>
              </div>
            </div>
            <a
              href={file.downloadUrl}
              download={file.fileName}
              className="post-file-download-btn"
              title={`Download ${file.fileName}`}
            >
              <i className="bi bi-download"></i> Download
            </a>
          </div>
        );
      })}
    </div>
  );
};

// Comment Attachment View Component
export const CommentAttachmentView = ({ attachment, onPhotoClick }) => {
  if (!attachment) return null;

  if (attachment.attachmentType === 'PHOTO') {
    return (
      <div className="comment-attachment-wrap">
        <img
          src={attachment.downloadUrl}
          alt={attachment.fileName}
          className="comment-photo-thumbnail"
          onClick={() => onPhotoClick && onPhotoClick(attachment.downloadUrl, attachment.fileName)}
          title={`Click to view ${attachment.fileName}`}
        />
      </div>
    );
  }

  const meta = getFileMeta(attachment.fileName);
  return (
    <div className="comment-attachment-wrap">
      <a
        href={attachment.downloadUrl}
        download={attachment.fileName}
        className="comment-file-badge"
        title={`Download ${attachment.fileName}`}
      >
        <i className={`bi ${meta.icon}`} style={{ color: meta.color }}></i>
        <span className="text-truncate" style={{ maxWidth: '200px' }}>
          {attachment.fileName}
        </span>
        <span className="text-muted small">({formatFileSize(attachment.fileSize)})</span>
        <i className="bi bi-download ms-1"></i>
      </a>
    </div>
  );
};

// Full-screen Lightbox Modal
export const LightboxModal = ({ image, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!image) return null;

  return (
    <div className="lightbox-backdrop" onClick={onClose}>
      <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
        <button className="lightbox-close-btn" onClick={onClose} title="Close (Esc)">
          &times;
        </button>
        <img src={image.url} alt={image.alt || 'Full preview'} />
        {image.alt && <div className="lightbox-caption">{image.alt}</div>}
      </div>
    </div>
  );
};
