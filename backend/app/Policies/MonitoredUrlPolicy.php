<?php

namespace App\Policies;

use App\Models\MonitoredUrl;
use App\Models\User;

class MonitoredUrlPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, MonitoredUrl $monitoredUrl): bool
    {
        return $user->id === $monitoredUrl->user_id;
    }

    public function create(User $user): bool
    {
        return true;
    }

    public function update(User $user, MonitoredUrl $monitoredUrl): bool
    {
        return $user->id === $monitoredUrl->user_id;
    }

    public function delete(User $user, MonitoredUrl $monitoredUrl): bool
    {
        return $user->id === $monitoredUrl->user_id;
    }
}
