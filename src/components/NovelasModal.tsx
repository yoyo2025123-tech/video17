import React, { useState, useEffect } from 'react';
import { X, Search, Star, Calendar, DollarSign, CreditCard, Filter, BookOpen, Play, ShoppingCart, Plus, Check } from 'lucide-react';
import { useAdmin } from '../context/AdminContext';
import { useCart } from '../context/CartContext';
import type { NovelasConfig } from '../types/admin';

interface NovelasModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NovelasModal({ isOpen, onClose }: NovelasModalProps) {
  const { getCurrentConfig } = useAdmin();
  const { addItem, removeItem, isInCart } = useCart();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'title' | 'year' | 'chapters' | 'price'>('title');
  const [paymentType, setPaymentType] = useState<'cash' | 'transfer'>('cash');

  // Obtener configuración actual del admin
  const currentConfig = getCurrentConfig();
  const novelas = currentConfig.novelas || [];

  if (!isOpen) return null;

  // Filtrar novelas
  const filteredNovelas = novelas.filter(novela => {
    const matchesSearch = novela.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         novela.genero.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGenre = selectedGenre === 'all' || novela.genero.toLowerCase().includes(selectedGenre.toLowerCase());
    return matchesSearch && matchesGenre;
  });

  // Ordenar novelas
  const sortedNovelas = [...filteredNovelas].sort((a, b) => {
    switch (sortBy) {
      case 'year':
        return b.año - a.año;
      case 'chapters':
        return b.capitulos - a.capitulos;
      case 'price':
        const priceA = paymentType === 'cash' ? a.costoEfectivo : a.costoTransferencia;
        const priceB = paymentType === 'cash' ? b.costoEfectivo : b.costoTransferencia;
        return priceA - priceB;
      default:
        return a.titulo.localeCompare(b.titulo);
    }
  });

  // Obtener géneros únicos
  const genres = [...new Set(novelas.map(novela => novela.genero))];

  const handleAddToCart = (novela: NovelasConfig) => {
    const cartItem = {
      id: novela.id + 100000, // Offset para evitar conflictos con IDs de TMDB
      title: novela.titulo,
      poster_path: null,
      type: 'tv' as const,
      vote_average: 8.5, // Valor por defecto para novelas
      selectedSeasons: [1],
      paymentType,
      // Datos adicionales para novelas
      isNovela: true,
      chapters: novela.capitulos,
      year: novela.año,
      genre: novela.genero,
      description: novela.descripcion,
      cashPrice: novela.costoEfectivo,
      transferPrice: novela.costoTransferencia
    };

    if (isInCart(cartItem.id)) {
      removeItem(cartItem.id);
    } else {
      addItem(cartItem);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-pink-600 to-purple-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="bg-white/20 p-3 rounded-xl mr-4 shadow-lg">
                <BookOpen className="h-8 w-8" />
              </div>
              <div>
                <h2 className="text-3xl font-bold">Catálogo de Novelas</h2>
                <p className="text-sm opacity-90">Descubre las mejores telenovelas y series dramáticas</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto max-h-[calc(95vh-120px)]">
          <div className="p-6">
            {/* Controles de búsqueda y filtros */}
            <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-2xl p-6 mb-6 border border-pink-200">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Búsqueda */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar novelas..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>

                {/* Filtro por género */}
                <select
                  value={selectedGenre}
                  onChange={(e) => setSelectedGenre(e.target.value)}
                  className="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                >
                  <option value="all">Todos los géneros</option>
                  {genres.map(genre => (
                    <option key={genre} value={genre.toLowerCase()}>{genre}</option>
                  ))}
                </select>

                {/* Ordenar por */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                >
                  <option value="title">Ordenar por título</option>
                  <option value="year">Ordenar por año</option>
                  <option value="chapters">Ordenar por capítulos</option>
                  <option value="price">Ordenar por precio</option>
                </select>

                {/* Tipo de pago */}
                <div className="flex space-x-2">
                  <button
                    onClick={() => setPaymentType('cash')}
                    className={`flex-1 px-4 py-3 rounded-xl font-medium transition-colors ${
                      paymentType === 'cash'
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-600 hover:bg-green-100'
                    }`}
                  >
                    <DollarSign className="h-4 w-4 inline mr-1" />
                    Efectivo
                  </button>
                  <button
                    onClick={() => setPaymentType('transfer')}
                    className={`flex-1 px-4 py-3 rounded-xl font-medium transition-colors ${
                      paymentType === 'transfer'
                        ? 'bg-orange-500 text-white'
                        : 'bg-gray-200 text-gray-600 hover:bg-orange-100'
                    }`}
                  >
                    <CreditCard className="h-4 w-4 inline mr-1" />
                    Transferencia
                  </button>
                </div>
              </div>
            </div>

            {/* Estadísticas */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-pink-50 rounded-xl p-4 border border-pink-200">
                <div className="text-center">
                  <div className="text-2xl font-bold text-pink-600">{novelas.length}</div>
                  <div className="text-sm text-pink-700">Total Novelas</div>
                </div>
              </div>
              <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{genres.length}</div>
                  <div className="text-sm text-purple-700">Géneros</div>
                </div>
              </div>
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{filteredNovelas.length}</div>
                  <div className="text-sm text-blue-700">Resultados</div>
                </div>
              </div>
              <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {Math.round(novelas.reduce((acc, n) => acc + n.capitulos, 0) / novelas.length) || 0}
                  </div>
                  <div className="text-sm text-green-700">Promedio Capítulos</div>
                </div>
              </div>
            </div>

            {/* Lista de novelas */}
            {sortedNovelas.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No se encontraron novelas
                </h3>
                <p className="text-gray-600">
                  Intenta con otros términos de búsqueda o filtros.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sortedNovelas.map((novela) => {
                  const price = paymentType === 'cash' ? novela.costoEfectivo : novela.costoTransferencia;
                  const itemId = novela.id + 100000;
                  const inCart = isInCart(itemId);

                  return (
                    <div key={novela.id} className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                      {/* Header de la tarjeta */}
                      <div className="bg-gradient-to-r from-pink-500 to-purple-500 p-4 text-white">
                        <h3 className="font-bold text-lg mb-1">{novela.titulo}</h3>
                        <div className="flex items-center justify-between text-sm opacity-90">
                          <span className="bg-white/20 px-2 py-1 rounded-full">{novela.genero}</span>
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            {novela.año}
                          </div>
                        </div>
                      </div>

                      {/* Contenido */}
                      <div className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center text-sm text-gray-600">
                            <Play className="h-4 w-4 mr-1" />
                            {novela.capitulos} capítulos
                          </div>
                          <div className="flex items-center">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                            <span className="text-sm font-medium">8.5</span>
                          </div>
                        </div>

                        {novela.descripcion && (
                          <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                            {novela.descripcion}
                          </p>
                        )}

                        {/* Precio */}
                        <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-3 mb-4 border border-green-200">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700">
                              {paymentType === 'cash' ? 'Efectivo' : 'Transferencia'}:
                            </span>
                            <span className="text-lg font-bold text-green-600">
                              ${price.toLocaleString()} CUP
                            </span>
                          </div>
                          {paymentType === 'transfer' && (
                            <div className="text-xs text-orange-600 mt-1">
                              +{currentConfig.pricing.transferFeePercentage}% recargo incluido
                            </div>
                          )}
                        </div>

                        {/* Botón de agregar al carrito */}
                        <button
                          onClick={() => handleAddToCart(novela)}
                          className={`w-full px-4 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center transform hover:scale-105 ${
                            inCart
                              ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white'
                              : 'bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white'
                          }`}
                        >
                          {inCart ? (
                            <>
                              <Check className="h-5 w-5 mr-2" />
                              En el Carrito
                            </>
                          ) : (
                            <>
                              <Plus className="h-5 w-5 mr-2" />
                              Agregar al Carrito
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}