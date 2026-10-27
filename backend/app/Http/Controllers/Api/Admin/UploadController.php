<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class UploadController extends Controller
{
    public function store(Request $request)
    {
        $request->validate(['file' => 'required|file|mimes:jpg,jpeg,png,webp,gif,svg,mp4|max:10240']);
        $file = $request->file('file');
        $name = now()->format('Y/m').'/'.Str::random(20).'.'.strtolower($file->getClientOriginalExtension());
        $path = $file->storeAs('uploads', $name, 'public');

        return response()->json(['url' => Storage::disk('public')->url($path), 'path' => $path], 201);
    }
}
