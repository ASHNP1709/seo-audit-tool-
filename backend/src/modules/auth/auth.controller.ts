// ============================================
// AuthController — API Endpoints for Authentication
// Like: php artisan make:controller Api/AuthController
//
// In Laravel you define routes in routes/api.php:
//   Route::post('/auth/register', [AuthController::class, 'register']);
//   Route::post('/auth/login', [AuthController::class, 'login']);
//   Route::middleware('auth:sanctum')->get('/auth/me', [AuthController::class, 'me']);
//
// In NestJS routes are defined with decorators on methods:
//   @Post('register')   → POST /api/auth/register
//   @Post('login')      → POST /api/auth/login
//   @Get('me')          → GET  /api/auth/me
//
// @Controller('auth') = all routes in this controller start with /auth
// Combined with app.setGlobalPrefix('api') in main.ts:
// Final routes become: /api/auth/register, /api/auth/login, /api/auth/me
// Like: Route::prefix('api/auth')->group(function() { ... })
// ============================================

import {
  Controller,      // Marks class as a controller (like class AuthController extends Controller)
  Post,            // HTTP POST decorator (like Route::post())
  Get,             // HTTP GET decorator (like Route::get())
  Body,            // Extracts request body (like $request->all() or $request->validated())
  UseGuards,       // Applies middleware to route (like Route::middleware('auth:sanctum'))
  Request,         // Full request object (like Request $request in Laravel)
  HttpCode,        // Sets HTTP status code (like return response()->json($data, 201))
  HttpStatus,      // Constants: OK=200, CREATED=201, etc.
} from '@nestjs/common';

import {
  ApiTags,         // Groups endpoints in Swagger (like section headers)
  ApiOperation,    // Describes what endpoint does (like @bodyParam in Scribe)
  ApiResponse,     // Shows example responses in Swagger (200, 201, 401, etc.)
  ApiBearerAuth,   // Adds 🔒 lock icon — tells Swagger "this route needs JWT"
                   // Like: adding @authenticated tag in Laravel Scribe
} from '@nestjs/swagger';

import { AuthService } from './auth.service';
import { RegisterDto, LoginDto } from './dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

// @ApiTags = In Swagger, all these routes appear under "Authentication" heading
// Like: @group Authentication in Laravel Scribe docs
@ApiTags('Authentication')

// @Controller('auth') = prefix all routes with /auth
// Like: Route::prefix('auth')->group(...)
@Controller('auth')
export class AuthController {

  // NestJS automatically injects AuthService (Dependency Injection)
  // Like: public function __construct(private AuthService $authService)
  constructor(private authService: AuthService) {}

  // ============================================
  // POST /api/auth/register
  // Like: Route::post('/register', [AuthController::class, 'register'])
  //
  // What happens when this endpoint is called:
  // 1. ValidationPipe validates body against RegisterDto
  // 2. If valid → this method runs
  // 3. If invalid → 400 error returned automatically
  // ============================================
  @Post('register')
  // Return 201 (Created) instead of default 200
  // Like: return response()->json($data, 201)
  @HttpCode(HttpStatus.CREATED)

  // Swagger: describe this endpoint for the docs page
  @ApiOperation({ summary: 'Register new user account' })

  // Swagger: show what SUCCESS response looks like
  // Client sees this example in docs and knows what to expect
  @ApiResponse({
    status: 201,
    description: 'User registered successfully. Returns user data + JWT tokens.',
    schema: {
      example: {
        user: {
          id: 'eda83db3-0b58-4f60-b60a-6de3cac974dc',
          email: 'admin@completeseoaudit.com',
          firstName: 'Ashish',
          lastName: null,
          role: 'USER',
        },
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6...',
        refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6...',
      },
    },
  })
  // Swagger: show what ERROR responses look like
  @ApiResponse({ status: 400, description: 'Validation error — invalid email, weak password, etc.' })
  @ApiResponse({ status: 409, description: 'Email already registered' })

  // @Body() extracts JSON body from request and validates it
  // Like: public function register(RegisterRequest $request)
  // RegisterDto validates automatically — if fails, 400 error returned
  // If passes, dto contains clean validated data
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  // ============================================
  // POST /api/auth/login
  // Like: Route::post('/login', [AuthController::class, 'login'])
  //
  // Flow:
  // 1. Client sends: {"email": "...", "password": "..."}
  // 2. ValidationPipe checks against LoginDto
  // 3. AuthService.login() checks email exists + password matches
  // 4. Returns user data + new JWT tokens
  // ============================================
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({
    status: 200,
    description: 'Login successful. Returns user data + JWT tokens.',
    schema: {
      example: {
        user: {
          id: 'eda83db3-0b58-4f60-b60a-6de3cac974dc',
          email: 'admin@completeseoaudit.com',
          firstName: 'Ashish',
          lastName: null,
          role: 'USER',
        },
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6...',
        refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6...',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Invalid email or password' })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  // ============================================
  // GET /api/auth/me — Protected route (requires JWT token)
  // Like: Route::middleware('auth:sanctum')->get('/me', function(Request $request) {
  //         return $request->user();
  //       })
  //
  // Flow:
  // 1. Client sends: GET /api/auth/me with Header "Authorization: Bearer eyJ..."
  // 2. JwtAuthGuard intercepts → calls JwtStrategy
  // 3. JwtStrategy validates token → sets req.user = { id, email, role }
  // 4. If token invalid/expired → 401 Unauthorized (never reaches this method)
  // 5. If token valid → this method runs with req.user available
  // ============================================

  // @UseGuards = apply middleware to THIS route only
  // Like: Route::middleware('auth:sanctum')
  // Without valid JWT → 401 Unauthorized error
  @UseGuards(JwtAuthGuard)
  @Get('me')

  // @ApiBearerAuth = shows 🔒 lock icon on this route in Swagger
  // Tells the developer: "You need to click Authorize and paste JWT first"
  // Without this, Swagger won't send the Authorization header
  @ApiBearerAuth()

  @ApiOperation({ summary: 'Get current logged-in user profile (requires JWT)' })
  @ApiResponse({
    status: 200,
    description: 'Returns current user profile with subscription info.',
    schema: {
      example: {
        id: 'eda83db3-0b58-4f60-b60a-6de3cac974dc',
        email: 'admin@completeseoaudit.com',
        firstName: 'Ashish',
        lastName: null,
        role: 'USER',
        avatar: null,
        isVerified: false,
        twoFactorEnabled: false,
        createdAt: '2026-02-24T10:00:00.000Z',
        subscription: {
          plan: 'FREE',
          status: 'ACTIVE',
          auditsUsed: 0,
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized — missing or invalid JWT token' })

  // @Request() gives access to the full request object
  // req.user is set by JwtStrategy.validate() — contains { id, email, role }
  // Like: $request->user() in Laravel
  async getProfile(@Request() req: any) {
    return this.authService.getProfile(req.user.id);
  }
}