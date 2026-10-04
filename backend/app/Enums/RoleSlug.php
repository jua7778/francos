<?php

namespace App\Enums;

enum RoleSlug: string
{
    case Admin = 'admin';
    case Mesero = 'mesero';
    case Cocina = 'cocina';
    case Caja = 'caja';
}
