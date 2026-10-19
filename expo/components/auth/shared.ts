/**
 * Shared constants, translations, and validators for the rebuilt auth
 * experience (login + signup). Kept in one place so both screens stay in sync
 * and the original functionality (EN/ES, terms, validation) is preserved.
 */

export const CRYSTAL_BALL_IMAGE =
  'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/89z8qu274hk8f1cht7vcg.png';

/** AsyncStorage flag marking that the cinematic intro has played once. */
export const INTRO_SEEN_KEY = '@alchemize/intro_seen_v1';
/** AsyncStorage flag marking that the terms have been accepted. */
export const TERMS_ACCEPTED_KEY = '@alchemize/terms_accepted_v1';

export type Language = 'en' | 'es';

export const AUTH_STRINGS = {
  en: {
    brand: 'Alchemize',
    tagline: 'Transform Your Life',
    login: 'Sign In',
    signup: 'Sign Up',
    createAccount: 'Create Account',
    welcomeBack: 'Welcome Back',
    welcomeBackSub: 'Continue your transformation',
    beginJourney: 'Begin Your Journey',
    beginJourneySub: 'Create your account to start',
    email: 'Email',
    password: 'Password',
    confirmPassword: 'Confirm Password',
    fullName: 'Full Name',
    rememberMe: 'Remember Me',
    forgotPassword: 'Forgot Password?',
    or: 'or continue with',
    signInWithApple: 'Continue with Apple',
    noAccount: "Don't have an account?",
    haveAccount: 'Already have an account?',
    signUpHere: 'Sign up',
    signInHere: 'Sign in',
    fillFields: 'Please fill in all fields',
    enterName: 'Please enter your name',
    invalidEmail: 'Please enter a valid email address',
    weakPassword: 'Password must be at least 6 characters',
    passwordMismatch: 'Passwords do not match',
    termsRequired: 'You must accept the Terms to continue',
    resetTitle: 'Reset Password',
    resetMessage: 'Enter your email to receive reset instructions',
    resetSent: 'Reset link sent! Check your email.',
    enterEmail: 'Please enter your email address',
    agreeLabel: 'I agree to the',
    termsLink: 'Terms & Privacy',
    termsTitle: 'Terms & Privacy Agreement',
    termsIntro: 'Please read carefully before using Alchemize.',
    iAgree: 'I Agree & Continue',
    decline: 'Decline',
    strengthLabels: ['Too short', 'Weak', 'Fair', 'Good', 'Strong'],
  },
  es: {
    brand: 'Alchemize',
    tagline: 'Transforma Tu Vida',
    login: 'Iniciar Sesión',
    signup: 'Registrarse',
    createAccount: 'Crear Cuenta',
    welcomeBack: 'Bienvenido de Nuevo',
    welcomeBackSub: 'Continúa tu transformación',
    beginJourney: 'Comienza Tu Viaje',
    beginJourneySub: 'Crea tu cuenta para empezar',
    email: 'Correo',
    password: 'Contraseña',
    confirmPassword: 'Confirmar Contraseña',
    fullName: 'Nombre Completo',
    rememberMe: 'Recuérdame',
    forgotPassword: '¿Olvidaste tu contraseña?',
    or: 'o continuar con',
    signInWithApple: 'Continuar con Apple',
    noAccount: '¿No tienes una cuenta?',
    haveAccount: '¿Ya tienes una cuenta?',
    signUpHere: 'Regístrate',
    signInHere: 'Inicia sesión',
    fillFields: 'Por favor completa todos los campos',
    enterName: 'Por favor ingresa tu nombre',
    invalidEmail: 'Por favor ingresa un correo válido',
    weakPassword: 'La contraseña debe tener al menos 6 caracteres',
    passwordMismatch: 'Las contraseñas no coinciden',
    termsRequired: 'Debes aceptar los Términos para continuar',
    resetTitle: 'Restablecer Contraseña',
    resetMessage: 'Ingresa tu correo para recibir instrucciones',
    resetSent: '¡Enlace enviado! Revisa tu correo.',
    enterEmail: 'Por favor ingresa tu correo electrónico',
    agreeLabel: 'Acepto los',
    termsLink: 'Términos y Privacidad',
    termsTitle: 'Acuerdo de Términos y Privacidad',
    termsIntro: 'Por favor lee con atención antes de usar Alchemize.',
    iAgree: 'Acepto y Continuar',
    decline: 'Rechazar',
    strengthLabels: ['Muy corta', 'Débil', 'Regular', 'Buena', 'Fuerte'],
  },
} as const;

export type AuthStrings = (typeof AUTH_STRINGS)['en'];

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export interface PasswordStrength {
  score: number; // 0..4
  label: string;
  color: string;
}

export function getPasswordStrength(
  password: string,
  labels: readonly string[],
): PasswordStrength {
  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 10) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { score: 1, label: labels[1], color: '#ef4444' };
  if (score <= 2) return { score: 2, label: labels[2], color: '#f59e0b' };
  if (score <= 3) return { score: 3, label: labels[3], color: '#eab308' };
  return { score: 4, label: labels[4], color: '#22c55e' };
}

export const TERMS_BODY_EN =
  'By using Alchemize you agree to the following:\n\n1. Use at Your Own Risk. This app is provided "as is" without warranties of any kind. Content (affirmations, fitness, nutrition, financial and wellness data) is for personal informational purposes only and is not professional medical, legal, or financial advice. Alchemize is not a medical device, has not been evaluated by the FDA or any regulator, and must never be used for medical diagnosis, treatment, or emergencies — call your doctor or emergency services for those.\n\n2. AI-Generated Content. Alchemize uses artificial intelligence (including third-party AI service providers) to analyze photos and text you submit and to generate estimates, suggestions, and content (for example: food/nutrition recognition from photos, workout suggestions, generated text). AI output can be inaccurate, incomplete, or misleading. You are responsible for independently verifying anything AI-generated before relying on it, especially calorie, nutrition, fitness, or financial figures. We are not liable for decisions made based on AI-generated content.\n\n3. Data & Privacy. We store the data you create (goals, habits, photos, journals, health metrics) to operate the app. Content and photos you submit for AI features may be sent to and processed by third-party AI providers as described in our Privacy Policy. If you connect Apple Health, HealthKit data is used only to power in-app features (like workout and activity sync) — we do not sell it and do not use it for advertising or marketing. We use industry-standard practices but no system is 100% secure.\n\n4. No Liability for Data Leaks. To the maximum extent permitted by law, Alchemize, its developers and affiliates are NOT responsible or liable for any data breaches, leaks, loss, unauthorized access, or damages arising from use of the app or third-party services (including Apple, Google, Supabase, RevenueCat, and our AI providers).\n\n5. Subscriptions. Paid plans, where offered, are billed through the Apple App Store or Google Play and auto-renew until cancelled. Manage or cancel your subscription anytime in your App Store or Play Store account settings; refunds are handled by Apple/Google per their policies.\n\n6. Age Requirement. Alchemize is not intended for children under 13 (or the minimum age required in your country). Do not use this app if you do not meet this requirement.\n\n7. Your Responsibility. You are responsible for keeping your account credentials secure and for the content you upload. Do not share sensitive medical, legal, or financial details that you would not want stored or processed by AI.\n\n8. Changes. We may update these Terms from time to time; continued use after changes means you accept the updated Terms.\n\n9. Consent. By tapping "I Agree" you confirm you have read, understood, and accepted these terms and our Privacy Policy.\n\n—\n\nDeveloped by Alchemize\nPowered & Designed by Metallicv1';

export const TERMS_BODY_ES =
  'Al usar Alchemize aceptas lo siguiente:\n\n1. Uso Bajo Tu Propio Riesgo. Esta aplicación se proporciona "tal cual" sin garantías de ningún tipo. El contenido (afirmaciones, fitness, nutrición, datos financieros y de bienestar) es solo para fines informativos personales y no constituye asesoramiento médico, legal o financiero profesional. Alchemize no es un dispositivo médico, no ha sido evaluado por la FDA ni ningún regulador, y nunca debe usarse para diagnóstico, tratamiento o emergencias médicas — llama a tu médico o a servicios de emergencia para eso.\n\n2. Contenido Generado por IA. Alchemize usa inteligencia artificial (incluidos proveedores externos de IA) para analizar las fotos y textos que envías y para generar estimaciones, sugerencias y contenido (por ejemplo: reconocimiento de comida/nutrición a partir de fotos, sugerencias de entrenamiento, texto generado). El resultado de la IA puede ser inexacto, incompleto o engañoso. Eres responsable de verificar de forma independiente cualquier contenido generado por IA antes de confiar en él, especialmente cifras de calorías, nutrición, fitness o finanzas. No somos responsables por decisiones tomadas con base en contenido generado por IA.\n\n3. Datos y Privacidad. Almacenamos los datos que creas (metas, hábitos, fotos, diarios, métricas de salud) para operar la app. El contenido y las fotos que envías para funciones de IA pueden enviarse a proveedores externos de IA para su procesamiento, como se describe en nuestra Política de Privacidad. Si conectas Apple Health, los datos de HealthKit se usan solo para funciones dentro de la app (como sincronizar entrenamientos y actividad) — no los vendemos ni los usamos para publicidad. Usamos prácticas estándar de la industria pero ningún sistema es 100% seguro.\n\n4. Sin Responsabilidad por Filtraciones de Datos. En la máxima medida permitida por la ley, Alchemize, sus desarrolladores y afiliados NO son responsables por filtraciones de datos, brechas, pérdidas, acceso no autorizado o daños derivados del uso de la app o servicios de terceros (incluidos Apple, Google, Supabase, RevenueCat y nuestros proveedores de IA).\n\n5. Suscripciones. Los planes de pago, cuando se ofrecen, se facturan a través de App Store o Google Play y se renuevan automáticamente hasta que se cancelen. Puedes gestionar o cancelar tu suscripción en cualquier momento desde la configuración de tu cuenta de App Store o Google Play; los reembolsos los gestionan Apple/Google según sus políticas.\n\n6. Edad Mínima. Alchemize no está destinado para menores de 13 años (o la edad mínima requerida en tu país). No uses esta app si no cumples este requisito.\n\n7. Tu Responsabilidad. Eres responsable de mantener seguras tus credenciales y del contenido que subes. No compartas información médica, legal o financiera sensible que no quieras almacenada o procesada por IA.\n\n8. Cambios. Podemos actualizar estos Términos ocasionalmente; el uso continuado después de los cambios implica que los aceptas.\n\n9. Consentimiento. Al tocar "Acepto" confirmas que has leído, comprendido y aceptado estos términos y nuestra Política de Privacidad.\n\n—\n\nDesarrollado por Alchemize\nPotenciado y Diseñado por Metallicv1';
