<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Traits\ApiResponse;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Validation\Validator;

abstract class ApiBaseController extends Controller
{
    use AuthorizesRequests, ApiResponse;

    /**
     * Validate admin access
     */
    protected function requireAdmin()
    {
        $this->authorize('admin');
    }

    /**
     * Handle validation errors consistently
     */
    protected function handleValidationFailure(Validator $validator)
    {
        return $this->validationError($validator->errors());
    }

    /**
     * Get file path for storage
     */
    protected function getStoragePath(string $folder): string
    {
        return 'uploads/' . $folder;
    }

    /**
     * Format response data
     */
    protected function formatResponse($data, string $message = 'Success', int $status = 200)
    {
        return $this->success($data, $message, $status);
    }
}
