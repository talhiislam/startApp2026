export async function uploadToCloudinary(
    file: File,
    onProgress?: (percent: number) => void
) : Promise<string> {
    const sigRes = await fetch("/api/upload/signature");
    const sig = await sigRes.json();

    if (!sigRes.ok || !sig.success) {
        throw new Error(sig.error?.message ?? sig.error ?? "Failed to get upload signature");
    }

    return new Promise((resolve, reject) => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("api_key", sig.api_key);
        formData.append("timestamp", sig.timestamp);
        formData.append("signature", sig.signature);
        formData.append("folder", sig.folder);

        const xhr = new XMLHttpRequest();

        xhr.upload.onprogress = (event) => {
            if (event.lengthComputable && onProgress) {
                onProgress(Math.round((event.loaded / event.total) * 100));
            }
        };

        xhr.onload = () => {
            try {
                const data = JSON.parse(xhr.responseText || "{}");
                if (xhr.status >= 200 && xhr.status < 300 && data.secure_url) {
                    resolve(data.secure_url);
                    return;
                }
                reject(
                    new Error(
                        data.error?.message ??
                        `Upload failed with status ${xhr.status}`
                    )
                );
            } catch {
                reject(new Error("Upload failed"));
            }
        };

        xhr.onerror = () => reject(new Error("Network error during upload"));
        xhr.onabort = () => reject(new Error("Upload cancelled"));

        xhr.open(
            "POST",
            `https://api.cloudinary.com/v1_1/${sig.cloud_name}/image/upload`
        );
        xhr.send(formData);
    });
}
