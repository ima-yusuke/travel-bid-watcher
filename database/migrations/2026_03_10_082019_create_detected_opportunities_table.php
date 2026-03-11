<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('opportunities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('monitored_url_id')->constrained()->onDelete('cascade');
            $table->string('identifier', 32);
            $table->string('title');
            $table->text('description')->nullable();
            $table->date('deadline')->nullable();
            $table->string('amount')->nullable();
            $table->string('location')->nullable();
            $table->text('url')->nullable();
            $table->json('data')->nullable();
            $table->timestamps();

            $table->index('monitored_url_id');
            $table->index('created_at');
            $table->unique(['monitored_url_id', 'identifier']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('opportunities');
    }
};
