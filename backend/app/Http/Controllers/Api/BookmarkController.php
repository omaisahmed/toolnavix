<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Bookmark;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class BookmarkController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $bookmarks = Bookmark::with('tool.category')->where('user_id', $user->id)->get();
        return response()->json($bookmarks);
    }

    public function store(Request $request)
    {
        $user = $request->user();

        $validator = Validator::make($request->all(), [
            'tool_id' => 'required|exists:tools,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $bookmark = Bookmark::updateOrCreate([
            'user_id' => $user->id,
            'tool_id' => $request->tool_id,
        ]);

        return response()->json($bookmark, 201);
    }

    public function destroy(Request $request, $toolId)
    {
        $user = $request->user();

        Bookmark::where('user_id', $user->id)->where('tool_id', $toolId)->delete();

        return response()->json(['message' => 'Bookmark removed']);
    }

    public function savedTools(Request $request)
    {
        $user = $request->user();

        $saved = Bookmark::with('tool.category')
            ->where('user_id', $user->id)
            ->orderByDesc('created_at')
            ->paginate((int) ($request->per_page ?? 24));

        $saved->getCollection()->transform(function (Bookmark $bookmark) {
            if ($bookmark->tool && $bookmark->tool->logo && ! (str_starts_with($bookmark->tool->logo, 'http://') || str_starts_with($bookmark->tool->logo, 'https://'))) {
                $bookmark->tool->logo = url('/storage/'.ltrim($bookmark->tool->logo, '/'));
            }

            return $bookmark;
        });

        return response()->json($saved);
    }

    public function saveTool(Request $request)
    {
        return $this->store($request);
    }

    public function removeSavedTool(Request $request, int $id)
    {
        $user = $request->user();

        $bookmark = Bookmark::where('user_id', $user->id)->where('id', $id)->first();
        if (! $bookmark) {
            return response()->json(['message' => 'Saved tool not found'], 404);
        }

        $bookmark->delete();

        return response()->json(['message' => 'Saved tool removed']);
    }
}
