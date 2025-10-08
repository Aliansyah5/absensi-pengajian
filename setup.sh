#!/bin/bash

# Script untuk setup dan menjalankan aplikasi absensi pengajian

echo "🚀 Aplikasi Absensi Pengajian Setup & Run Script"
echo "================================================"

# Function untuk menampilkan menu
show_menu() {
    echo ""
    echo "Pilih opsi:"
    echo "1. Install dependencies"
    echo "2. Setup environment file"
    echo "3. Run development server"
    echo "4. Build for production"
    echo "5. Run database setup"
    echo "6. Exit"
    echo ""
    read -p "Masukkan pilihan (1-6): " choice
}

# Function untuk install dependencies
install_deps() {
    echo "📦 Installing dependencies..."
    npm install
    echo "✅ Dependencies installed successfully!"
}

# Function untuk setup environment
setup_env() {
    echo "⚙️ Setting up environment file..."
    if [ ! -f .env ]; then
        cp .env.example .env
        echo "📄 .env file created from .env.example"
        echo "⚠️  Please edit .env file and add your Supabase credentials"
        echo "   - VITE_SUPABASE_URL"
        echo "   - VITE_SUPABASE_ANON_KEY"
    else
        echo "⚠️  .env file already exists"
    fi
}

# Function untuk run dev server
run_dev() {
    echo "🔥 Starting development server..."
    npm run dev
}

# Function untuk build production
build_prod() {
    echo "🏗️ Building for production..."
    npm run build
    echo "✅ Build completed! Check the 'dist' folder"
}

# Function untuk database setup info
db_setup() {
    echo "🗄️ Database Setup Instructions:"
    echo "1. Create a new Supabase project at https://supabase.com"
    echo "2. Copy your project URL and anon key to .env file"
    echo "3. Go to Supabase SQL Editor"
    echo "4. Run the SQL script from database/schema.sql"
    echo "5. Optionally run database/functions.sql for additional functions"
    echo ""
    echo "Default login credentials:"
    echo "Email: admin@pengajian.com"
    echo "Password: password"
}

# Main script loop
while true; do
    show_menu
    case $choice in
        1)
            install_deps
            ;;
        2)
            setup_env
            ;;
        3)
            run_dev
            ;;
        4)
            build_prod
            ;;
        5)
            db_setup
            ;;
        6)
            echo "👋 Goodbye!"
            exit 0
            ;;
        *)
            echo "❌ Invalid option. Please choose 1-6."
            ;;
    esac

    echo ""
    read -p "Press Enter to continue..."
done
