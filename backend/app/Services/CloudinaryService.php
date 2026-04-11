<?php

namespace App\Services;

use Cloudinary\Api\Upload\UploadApi;
use Cloudinary\Configuration\Configuration;
use Cloudinary\Cloudinary;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Log;

class CloudinaryService
{
    protected $cloudinary;

    public function __construct()
    {
        $this->cloudinary = new Cloudinary([
            'cloud' => [
                'cloud_name' => config('services.cloudinary.cloud_name'),
                'api_key' => config('services.cloudinary.api_key'),
                'api_secret' => config('services.cloudinary.api_secret'),
            ],
            'url' => [
                'secure' => true,
            ],
        ]);
    }

    /**
     * Upload an image to Cloudinary
     *
     * @param UploadedFile $file
     * @param string $folder
     * @param string|null $publicId
     * @return array|null
     */
    public function uploadImage(UploadedFile $file, string $folder, string $publicId = null): ?array
    {
        try {
            // Validate file
            if (!$file->isValid()) {
                Log::error('Invalid file uploaded');
                return null;
            }

            // Check file type
            if (!str_starts_with($file->getMimeType(), 'image/')) {
                Log::error('File is not an image');
                return null;
            }

            // Note: Size validation removed as requested, but keep UX message

            $uploadApi = $this->cloudinary->uploadApi();

            $options = [
                'folder' => "toolnavix/{$folder}",
                'resource_type' => 'image',
                'transformation' => [
                    'quality' => 'auto',
                    'fetch_format' => 'auto',
                ],
            ];

            if ($publicId) {
                $options['public_id'] = $publicId;
                $options['overwrite'] = true;
            }

            $result = $uploadApi->upload($file->getRealPath(), $options);

            return [
                'secure_url' => $result['secure_url'],
                'public_id' => $result['public_id'],
            ];

        } catch (\Exception $e) {
            Log::error('Cloudinary upload failed: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Delete an image from Cloudinary
     *
     * @param string $publicId
     * @return bool
     */
    public function deleteImage(string $publicId): bool
    {
        try {
            $uploadApi = $this->cloudinary->uploadApi();
            $result = $uploadApi->destroy($publicId);

            return $result['result'] === 'ok';
        } catch (\Exception $e) {
            Log::error('Cloudinary delete failed: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Generate optimized image URL with transformations
     *
     * @param string $publicId
     * @param array $transformations
     * @return string
     */
    public function getOptimizedUrl(string $publicId, array $transformations = []): string
    {
        $defaultTransformations = [
            'quality' => 'auto',
            'format' => 'auto',
        ];

        $transformations = array_merge($defaultTransformations, $transformations);

        return $this->cloudinary->image($publicId)->addTransformation($transformations)->toUrl();
    }
}