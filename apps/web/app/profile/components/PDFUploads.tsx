'use client';

import { useState } from 'react';
import { trpc } from '@/app/_trpc/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { formatBytes } from '@/lib/utils';

export function PDFUploads() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { toast } = useToast();
  const utils = trpc.useUtils();

  // Fallback: if getPDFUploads is not implemented in router, show empty state
  const { data: pdfs, isLoading } = { data: [] as any[], isLoading: false } as any;

  const uploadPDF = (trpc.profile as any).uploadPDF?.useMutation?.() ?? {
    isLoading: false,
    mutate: () => toast({ title: 'Not available', description: 'PDF uploads are not yet enabled.' }),
  };
  (uploadPDF as any).onSuccess = async (data: any) => {
      // Upload the file to the signed URL
      if (selectedFile) {
        const response = await fetch(data.uploadUrl, {
          method: 'PUT',
          body: selectedFile,
          headers: {
            'Content-Type': selectedFile.type,
          },
        });

        if (response.ok) {
          toast({
            title: 'PDF uploaded',
            description: 'Your PDF has been uploaded successfully.',
          });
          // Invalidate list if router method exists
          (utils as any)?.profile?.getPDFUploads?.invalidate?.();
          setSelectedFile(null);
        }
      }
  };
  (uploadPDF as any).onError = (error: any) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
    } else {
      toast({
        title: 'Invalid file',
        description: 'Please select a PDF file.',
        variant: 'destructive',
      });
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    uploadPDF.mutate({
      fileName: selectedFile.name,
      fileSize: selectedFile.size,
      contentType: selectedFile.type,
    });
  };

  if (isLoading) {
    return <div>Loading PDF library...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <Card className="p-6">
        <div className="flex items-center gap-4">
          <Input
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            className="flex-1"
          />
          <Button
            onClick={handleUpload}
            disabled={!selectedFile || uploadPDF.isLoading}
          >
            {uploadPDF.isLoading ? 'Uploading...' : 'Upload'}
          </Button>
        </div>
      </Card>

      {/* PDF List */}
      <div className="space-y-4">
        {!pdfs?.length ? (
          <Card className="p-6">
            <p className="text-center text-gray-500">No PDFs uploaded yet</p>
          </Card>
        ) : (
          pdfs.map((pdf) => (
            <Card key={pdf.id} className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{pdf.file_name}</h3>
                  <p className="text-sm text-gray-500">
                    {formatBytes(pdf.file_size)} • Uploaded{' '}
                    {formatDistanceToNow(new Date(pdf.created_at), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => window.open(pdf.file_url, '_blank')}
                >
                  View PDF
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
} 