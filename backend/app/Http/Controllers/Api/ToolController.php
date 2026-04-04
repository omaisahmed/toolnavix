<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Tool;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ToolController extends Controller
{
    public function index(Request $request)
    {
        $query = Tool::with('category');

        if ($request->filled('category')) {
            $query->whereHas('category', function ($q) use ($request) {
                $q->where('slug', $request->category);
            });
        }

        if ($request->filled('pricing')) {
            $query->where('pricing', $request->pricing);
        }

        if ($request->filled('rating')) {
            $query->where('rating', '>=', floatval($request->rating));
        }

        if ($request->filled('search')) {
            $query->where('name', 'like', '%'.$request->search.'%')->orWhere('description', 'like', '%'.$request->search.'%');
        }

        if ($request->filled('sort')) {
            if ($request->sort === 'trending') {
                $query->orderByDesc('trending')->orderByDesc('updated_at');
            } elseif ($request->sort === 'new') {
                $query->orderByDesc('created_at');
            } elseif ($request->sort === 'top-rated') {
                $query->orderByDesc('rating');
            }
        } else {
            $query->orderByDesc('featured');
        }

        $tools = $query->paginate(16);

        return response()->json($tools);
    }

    public function show(string $slug)
    {
        $tool = Tool::with(['category', 'reviews'])->where('slug', $slug)->firstOrFail();

        return response()->json($tool);
    }

    public function store(Request $request)
    {
        $this->authorize('admin');

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'slug' => 'required|string|unique:tools,slug',
            'description' => 'required|string',
            'category_id' => 'required|exists:categories,id',
            'pricing' => 'required|in:free,paid,freemium',
            'rating' => 'nullable|numeric|min:0|max:5',
            'visit_url' => 'required|url',
            'logo' => 'sometimes|string|max:255',
            'featured' => 'boolean',
            'trending' => 'boolean',
            'just_landed' => 'boolean',
            'features' => 'json',
            'pros' => 'json',
            'cons' => 'json',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $tool = Tool::create($validator->validated());

        return response()->json($tool, 201);
    }

    public function update(Request $request, Tool $tool)
    {
        $this->authorize('admin');

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|string|max:255',
            'slug' => 'sometimes|string|unique:tools,slug,'.$tool->id,
            'description' => 'sometimes|string',
            'category_id' => 'sometimes|exists:categories,id',
            'pricing' => 'sometimes|in:free,paid,freemium',
            'rating' => 'sometimes|numeric|min:0|max:5',
            'visit_url' => 'sometimes|url',
            'logo' => 'sometimes|string|max:255',
            'featured' => 'sometimes|boolean',
            'trending' => 'sometimes|boolean',
            'just_landed' => 'sometimes|boolean',
            'features' => 'sometimes|json',
            'pros' => 'sometimes|json',
            'cons' => 'sometimes|json',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $tool->update($validator->validated());

        return response()->json($tool);
    }

    public function destroy(Tool $tool)
    {
        $this->authorize('admin');
        $tool->delete();
        return response()->json(['message' => 'Tool deleted']);
    }
}