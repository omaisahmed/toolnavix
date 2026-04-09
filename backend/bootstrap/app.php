<?php

use App\Http\Middleware\CorsMiddleware;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->prepend(CorsMiddleware::class);
        $middleware->validateCsrfTokens(except: [
            // API routes don't need CSRF protection
            'api/*',
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // Handle all exceptions in API context
        $exceptions->render(function (Throwable $e, $request) {
            // Only handle API routes
            if (!str_starts_with($request->getPathInfo(), '/api')) {
                return null;
            }

            // Handle authorization exceptions
            if ($e instanceof \Illuminate\Auth\AuthorizationException) {
                return response()->json([
                    'message' => 'Unauthorized',
                    'errors' => ['authorization' => [$e->getMessage() ?: 'This action is unauthorized.']],
                ], 403);
            }

            // Handle authentication exceptions
            if ($e instanceof \Illuminate\Auth\AuthenticationException) {
                return response()->json([
                    'message' => 'Unauthenticated',
                    'errors' => ['auth' => ['Authentication failed. Please log in.']],
                ], 401);
            }

            // Handle validation exceptions
            if ($e instanceof \Illuminate\Validation\ValidationException) {
                return response()->json([
                    'message' => 'Validation failed',
                    'errors' => $e->errors(),
                ], 422);
            }

            // Handle not found exceptions
            if ($e instanceof \Symfony\Component\HttpKernel\Exception\NotFoundHttpException) {
                return response()->json([
                    'message' => 'Not found',
                ], 404);
            }

            // Handle method not allowed exceptions  
            if ($e instanceof \Symfony\Component\HttpKernel\Exception\MethodNotAllowedHttpException) {
                return response()->json([
                    'message' => 'Method not allowed',
                ], 405);
            }

            // Handle general exceptions in API context
            if (app()->environment('production')) {
                return response()->json([
                    'message' => 'Server error',
                ], 500);
            } else {
                return response()->json([
                    'message' => $e->getMessage(),
                    'exception' => get_class($e),
                    'file' => $e->getFile(),
                    'line' => $e->getLine(),
                    'trace' => array_slice(explode("\n", $e->getTraceAsString()), 0, 10),
                ], 500);
            }
        });
    })->create();
