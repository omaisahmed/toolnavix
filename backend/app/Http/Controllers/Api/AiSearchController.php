<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Tool;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Validator;

class AiSearchController extends Controller
{
    public function search(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'query' => 'required|string|min:3',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $query = $request->query;

        $openAiKey = config('services.openai.key');
        if (!$openAiKey) {
            return response()->json(['message' => 'OpenAI key not configured'], 500);
        }

        $openaiResponse = Http::withToken($openAiKey)
            ->acceptJson()
            ->post('https://api.openai.com/v1/chat/completions', [
                'model' => 'gpt-4o-mini',
                'messages' => [
                    ['role' => 'system', 'content' => 'You are an intelligent AI assistant mapping user intent to tool category suggestions.'],
                    ['role' => 'user', 'content' => "User intent: $query. Provide 5 relevant categories or tags and 10 relevant tool names. Return JSON: {\n \"categories\": [..],\n \"tags\": [..],\n \"tool_names\": [..]\n }"],
                ],
                'max_tokens' => 300,
                'temperature' => 0.2,
            ]);

        if ($openaiResponse->failed()) {
            return response()->json(['message' => 'OpenAI request failed', 'error' => $openaiResponse->body()], 500);
        }

        $parsed = json_decode($openaiResponse->json('choices.0.message.content'), true);
        if (!is_array($parsed)) {
            $parsed = ['categories' => [], 'tags' => [], 'tool_names' => []];
        }

        $tools = Tool::query();

        if (!empty($parsed['categories'])) {
            $tools->whereHas('category', function ($q) use ($parsed) {
                $q->whereIn('slug', array_map('strtolower', $parsed['categories']));
            });
        }

        if (!empty($parsed['tool_names'])) {
            $named = array_map('strtolower', $parsed['tool_names']);
            $tools->orWhereIn('name', $parsed['tool_names']);
        }

        $resultTools = $tools->take(24)->get();

        return response()->json(['predictions' => $parsed, 'tools' => $resultTools]);
    }
}
