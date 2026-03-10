<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('detected_opportunities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('monitored_url_id')->constrained()->onDelete('cascade');
            $table->text('title');
            $table->text('url');
            $table->date('published_date')->nullable();
            $table->string('department')->nullable();
            $table->json('matched_keywords');
            $table->string('content_hash', 64);
            $table->timestamp('notified_at')->nullable();
            $table->timestamps();

            $table->index('monitored_url_id');
            $table->index('created_at');
            $table->unique(['monitored_url_id', 'content_hash']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('detected_opportunities');
    }
};
