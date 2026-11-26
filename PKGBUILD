# Maintainer: ichthys2k
pkgname=todotxtwebapp
pkgver=1.3.26
pkgrel=1
pkgdesc="Eine moderne WebApp zur Verwaltung von Aufgaben im todo.txt-Format"
arch=('x86_64')
url="https://github.com/ichthys2k/todotxt"
license=('MIT')
depends=('gtk3' 'nss' 'alsa-lib' 'libxss' 'glibc')
makedepends=('nodejs' 'npm')
options=('!strip' '!zipman')

build() {
  cd "$srcdir/.."
  npm install
  npm run electron:pacman
}

package() {
  cd "$srcdir/.."
  # Package installation if building from PKGBUILD
  install -dm755 "$pkgdir/usr/bin"
  install -dm755 "$pkgdir/usr/share/applications"
  install -dm755 "$pkgdir/usr/share/icons/hicolor/512x512/apps"
  
  if [ -f "todotxt.desktop" ]; then
    install -m644 todotxt.desktop "$pkgdir/usr/share/applications/todotxt.desktop"
  fi
  if [ -f "public/icon.png" ]; then
    install -m644 public/icon.png "$pkgdir/usr/share/icons/hicolor/512x512/apps/todotxt.png"
  fi
}
