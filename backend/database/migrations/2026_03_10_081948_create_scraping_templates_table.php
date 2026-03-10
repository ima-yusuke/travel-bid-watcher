<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('scraping_templates', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100);
            $table->string('list_selector');
            $table->string('title_selector');
            $table->string('date_selector');
            $table->string('link_selector');
            $table->string('department_selector')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('scraping_templates');
    }
};
