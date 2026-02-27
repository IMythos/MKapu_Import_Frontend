export interface Provincia {
  nombre: string;
  distritos: string[];
}

export const DEPARTAMENTOS_PROVINCIAS: Record<string, Provincia[]> = {
  'Amazonas': [
    {
      nombre: 'Chachapoyas',
      distritos: [
        'Chachapoyas', 'Asunción', 'Balsas', 'Cheto', 'Chiliquín', 'Chuquibamba',
        'Granada', 'Huancas', 'La Jalca', 'Leimebamba', 'Levanto', 'Magdalena',
        'Mariscal Castilla', 'Molinopampa', 'Montevideo', 'Olleros', 'Quinjalca',
        'San Francisco de Daguas', 'San Isidro de Maino', 'Soloco', 'Sonche'
      ]
    },
    {
      nombre: 'Bagua',
      distritos: ['Bagua', 'Aramango', 'Copallín', 'El Parco', 'Imaza', 'La Peca']
    },
    {
      nombre: 'Bongará',
      distritos: [
        'Jumbilla', 'Chisquilla', 'Churuja', 'Corosha', 'Cuispes', 'Florida',
        'Jazán', 'Recta', 'San Carlos', 'Shipasbamba', 'Valera', 'Yambrasbamba'
      ]
    },
    {
      nombre: 'Condorcanqui',
      distritos: ['Nieva', 'El Cenepa', 'Río Santiago']
    },
    {
      nombre: 'Luya',
      distritos: [
        'Lamud', 'Camporredondo', 'Cocabamba', 'Colcamar', 'Conila', 'Inguilpata',
        'Longuita', 'Lonya Chico', 'Luya', 'Luya Viejo', 'María', 'Ocalli',
        'Ocumal', 'Pisuquia', 'Providencia', 'San Cristóbal', 'San Francisco del Yeso',
        'San Jerónimo', 'San Juan de Lopecancha', 'Santa Catalina', 'Santo Tomás',
        'Tingo', 'Trita'
      ]
    },
    {
      nombre: 'Rodríguez de Mendoza',
      distritos: [
        'San Nicolás', 'Chirimoto', 'Cochamal', 'Huambo', 'Limabamba', 'Longar',
        'Mariscal Benavides', 'Milpuc', 'Omia', 'Santa Rosa', 'Totora', 'Vista Alegre'
      ]
    },
    {
      nombre: 'Utcubamba',
      distritos: ['Bagua Grande', 'Cajaruro', 'Cumba', 'El Milagro', 'Jamalca', 'Lonya Grande', 'Yamón']
    }
  ],
  'Áncash': [
    {
      nombre: 'Huaraz',
      distritos: ['Huaraz', 'Cochabamba', 'Colcabamba', 'Huanchay', 'Jangas', 'La Libertad', 'Olleros', 'Pampas Grande', 'Pariacoto', 'Pira', 'Tarica', 'Independencia']
    },
    {
      nombre: 'Aija',
      distritos: ['Aija', 'Coris', 'Huacllan', 'La Merced', 'Succha']
    },
    {
      nombre: 'Antonio Raymondi',
      distritos: ['Llamellín', 'Aczo', 'Chaccho', 'Chingas', 'Mirgas', 'San Juan de Rontoy']
    },
    {
      nombre: 'Asunción',
      distritos: ['Chacas', 'Acochaca']
    },
    {
      nombre: 'Bolognesi',
      distritos: ['Chiquián', 'Abelardo Pardo Lezameta', 'Antonio Raymondi', 'Aquia', 'Cajacay', 'Canis', 'Colquioc', 'Huallanca', 'Huasta', 'Huayllacayán', 'La Primavera', 'Mangas', 'Pacllón', 'San Miguel de Corpanqui', 'Ticllos']
    },
    {
      nombre: 'Carhuaz',
      distritos: ['Carhuaz', 'Acopampa', 'Amashca', 'Anta', 'Marcara', 'Pariahuanca', 'San Miguel de Aco', 'Shilla', 'Tinco', 'Yungar']
    },
    {
      nombre: 'Carlos Fermín Fitzcarrald',
      distritos: ['San Luis', 'San Nicolás', 'Yauya']
    },
    {
      nombre: 'Casma',
      distritos: ['Casma', 'Buena Vista Alta', 'Comandante Noel', 'Yaután']
    },
    {
      nombre: 'Corongo',
      distritos: ['Corongo', 'Aco', 'Bambas', 'Cusca', 'La Pampa', 'Yánac', 'Yupán']
    },
    {
      nombre: 'Huari',
      distritos: ['Huari', 'Anra', 'Cajay', 'Chavín de Huántar', 'Huacachi', 'Huacchis', 'Huachis', 'Huantar', 'Masin', 'Paucas', 'Pontó', 'Rahuapampa', 'Rapayán', 'San Marcos', 'San Pedro de Chaná', 'Uco']
    },
    {
      nombre: 'Huarmey',
      distritos: ['Huarmey', 'Cochapeti', 'Culebras', 'Huayan', 'Malvas']
    },
    {
      nombre: 'Huaylas',
      distritos: ['Caraz', 'Huallanca', 'Huata', 'Huaylas', 'Mato', 'Pamparomás', 'Pueblo Libre', 'Santa Cruz', 'Santo Toribio', 'Yuracmarca']
    },
    {
      nombre: 'Mariscal Luzuriaga',
      distritos: ['Piscobamba', 'Casca', 'Eleazar Guzmán Barrón', 'Fidel Olivas Escudero', 'Llama', 'Llumpa', 'Lucma', 'Musga']
    },
    {
      nombre: 'Ocros',
      distritos: ['Ocros', 'Acas', 'Cajamarquilla', 'Carhuapampa', 'Cochas', 'Congas', 'Llipa', 'San Cristóbal de Raján', 'San Pedro', 'Santiago de Chilcas']
    },
    {
      nombre: 'Pallasca',
      distritos: ['Cabana', 'Bolognesi', 'Conchucos', 'Huacaschuque', 'Huandoval', 'Lacabamba', 'Llapo', 'Pallasca', 'Pampas', 'Santa Rosa', 'Tauca']
    },
    {
      nombre: 'Pomabamba',
      distritos: ['Pomabamba', 'Huayllán', 'Parobamba', 'Quinuabamba']
    },
    {
      nombre: 'Recuay',
      distritos: ['Recuay', 'Catac', 'Cotaparaco', 'Huayllapampa', 'Llacllín', 'Marca', 'Pampas Chico', 'Pararín', 'Tapacocha', 'Ticapampa']
    },
    {
      nombre: 'Santa',
      distritos: ['Chimbote', 'Cáceres del Perú', 'Coishco', 'Macate', 'Moro', 'Nepeña', 'Samanco', 'Santa', 'Nuevo Chimbote']
    },
    {
      nombre: 'Sihuas',
      distritos: ['Sihuas', 'Acobamba', 'Alfonso Ugarte', 'Cashapampa', 'Chingalpo', 'Huayllabamba', 'Quiches', 'Ragash', 'San Juan', 'Sicsibamba']
    },
    {
      nombre: 'Yungay',
      distritos: ['Yungay', 'Cascapara', 'Manco', 'Matacoto', 'Quillo', 'Ranrahirca', 'Shupluy', 'Yanama']
    }
  ],
  'Apurímac': [
    {
      nombre: 'Abancay',
      distritos: ['Abancay', 'Chacoche', 'Circa', 'Curahuasi', 'Huanipaca', 'Lambrama', 'Pichirhua', 'San Pedro de Cachora', 'Tamburco']
    },
    {
      nombre: 'Andahuaylas',
      distritos: [
        'Andahuaylas', 'Andarapa', 'Chiara', 'Huancarama', 'Huancaray', 'Huayana',
        'Kaquiabamba', 'Kishuara', 'Pacobamba', 'Pacucha', 'Pampachiri', 'Pomacocha',
        'San Antonio de Cachi', 'San Jerónimo', 'San Miguel de Chaccrampa', 'Santa María de Chicmo', 'Talavera', 'Tumay Huaraca', 'Turpo'
      ]
    },
    {
      nombre: 'Antabamba',
      distritos: ['Antabamba', 'El Oro', 'Huaquirca', 'Juan Espinoza Medrano', 'Oropesa', 'Pachaconas', 'Sabaino']
    },
    {
      nombre: 'Aymaraes',
      distritos: [
        'Chalhuanca', 'Capaya', 'Caraybamba', 'Colcabamba', 'Cotaruse', 'Ihuayllo',
        'Justo Apu Sahuaraura', 'Lucre', 'Pocohuanca', 'San Juan de Chacña', 'Sañayca',
        'Soraya', 'Tapairihua', 'Tintay', 'Toraya', 'Yanaca'
      ]
    },
    {
      nombre: 'Cotabambas',
      distritos: ['Tambobamba', 'Cotabambas', 'Coyllurqui', 'Haquira', 'Mara', 'Challhuahuacho']
    },
    {
      nombre: 'Chincheros',
      distritos: ['Chincheros', 'Anco-Huallo', 'Cocharcas', 'Huaccana', 'Ocobamba', 'Ongoy', 'Uranmarca', 'Ranracancha', 'Rocchacc', 'El Porvenir', 'Los Chankas']
    },
    {
      nombre: 'Grau',
      distritos: ['Chuquibambilla', 'Curpahuasi', 'Gamarra', 'Huayllati', 'Mamara', 'Micaela Bastidas', 'Pataypampa', 'Progreso', 'San Antonio', 'Santa Rosa', 'Turpay', 'Vilcabamba', 'Virundo', 'Curasco']
    }
  ],
  'Arequipa': [
    {
      nombre: 'Arequipa',
      distritos: [
        'Arequipa', 'Alto Selva Alegre', 'Cayma', 'Cerro Colorado', 'Characato',
        'Chiguata', 'Jacobo Hunter', 'José Luis Bustamante y Rivero', 'La Joya',
        'Mariano Melgar', 'Miraflores', 'Mollebaya', 'Paucarpata', 'Pocsi',
        'Polobaya', 'Quequeña', 'Sabandía', 'Sachaca', 'San Juan de Siguas',
        'San Juan de Tarucani', 'Santa Isabel de Siguas', 'Santa Rita de Siguas',
        'Socabaya', 'Tiabaya', 'Uchumayo', 'Vitor', 'Yanahuara', 'Yarabamba', 'Yura'
      ]
    },
    {
      nombre: 'Camaná',
      distritos: ['Camaná', 'José María Quimper', 'Mariano Nicolás Valcárcel', 'Mariscal Cáceres', 'Nicolás de Piérola', 'Ocoña', 'Quilca', 'Samuel Pastor']
    },
    {
      nombre: 'Caravelí',
      distritos: ['Caravelí', 'Acarí', 'Atico', 'Atiquipa', 'Bella Unión', 'Cahuacho', 'Chala', 'Chaparra', 'Huanuhuanu', 'Jaqui', 'Lomas', 'Quicacha', 'Yauca']
    },
    {
      nombre: 'Castilla',
      distritos: ['Aplao', 'Andagua', 'Ayo', 'Chachas', 'Chilcaymarca', 'Choco', 'Huancarqui', 'Machaguay', 'Orcopampa', 'Pampacolca', 'Tipán', 'Uñón', 'Uraca', 'Viraco']
    },
    {
      nombre: 'Caylloma',
      distritos: ['Chivay', 'Achoma', 'Cabanaconde', 'Callalli', 'Caylloma', 'Coporaque', 'Huambo', 'Huanca', 'Ichupampa', 'Lari', 'Lluta', 'Maca', 'Madrigal', 'Majes', 'Mulli', 'Pinchollo', 'San Antonio de Chuca', 'Sibayo', 'Tapay', 'Tuti', 'Yanque']
    },
    {
      nombre: 'Condesuyos',
      distritos: ['Chuquibamba', 'Andaray', 'Cayarani', 'Chichas', 'Iray', 'Río Grande', 'Salamanca', 'Yanaquihua']
    },
    {
      nombre: 'Islay',
      distritos: ['Mollendo', 'Cocachacra', 'Dean Valdivia', 'Islay', 'Mejía', 'Punta de Bombón']
    },
    {
      nombre: 'La Unión',
      distritos: ['Cotahuasi', 'Alca', 'Charcana', 'Huaynacotas', 'Pampamarca', 'Puyca', 'Quechualla', 'Sayla', 'Tauria', 'Tomepampa', 'Toro']
    }
  ],
  'Ayacucho': [
    {
      nombre: 'Huamanga',
      distritos: ['Ayacucho', 'Acocro', 'Acos Vinchos', 'Carmen Alto', 'Chiara', 'Ocros', 'Pacaycasa', 'Quinua', 'San José de Ticllas', 'San Juan Bautista', 'Santiago de Pischa', 'Socos', 'Tambillo', 'Vinchos', 'Jesús Nazareno', 'Andrés Avelino Cáceres Dorregaray']
    },
    {
      nombre: 'Cangallo',
      distritos: ['Cangallo', 'Chuschi', 'Los Morochucos', 'María Parado de Bellido', 'Paras', 'Totos']
    },
    {
      nombre: 'Huanca Sancos',
      distritos: ['Sancos', 'Carapo', 'Sacsamarca', 'Santiago de Lucanamarca']
    },
    {
      nombre: 'Huanta',
      distritos: ['Huanta', 'Ayahuanco', 'Huamanguilla', 'Iguain', 'Luricocha', 'Santillana', 'Sivia', 'Llochegua', 'Canayre', 'Uchuraccay', 'Pucacolpa', 'Chaca']
    },
    {
      nombre: 'La Mar',
      distritos: ['San Miguel', 'Anco', 'Ayna', 'Chilcas', 'Chungui', 'Luis Carranza', 'Santa Rosa', 'Tambo', 'Samugari', 'Anchihuay', 'Oronccoy']
    },
    {
      nombre: 'Lucanas',
      distritos: ['Puquio', 'Aucara', 'Cabana', 'Carmen Salcedo', 'Chaviña', 'Chipao', 'Huac-Huas', 'Laramate', 'Leoncio Prado', 'Llauta', 'Lucanas', 'Ocaña', 'Otoca', 'Saisa', 'San Cristóbal', 'San Juan', 'San Pedro', 'San Pedro de Palco', 'Sancos', 'Santa Ana de Huaycahuacho', 'Santa Lucía']
    },
    {
      nombre: 'Parinacochas',
      distritos: ['Coracora', 'Chumpi', 'Coronel Castañeda', 'Pacapausa', 'Pullo', 'Puyusca', 'San Francisco de Ravacayco', 'Upahuacho']
    },
    {
      nombre: 'Paucar del Sara Sara',
      distritos: ['Pausa', 'Colta', 'Corculla', 'Lampa', 'Marcabamba', 'Oyolo', 'Pararca', 'San Javier de Alpabamba', 'San José de Ushua', 'Sara Sara']
    },
    {
      nombre: 'Sucre',
      distritos: ['Querobamba', 'Belén', 'Chalcos', 'Chilcayoc', 'Huacaña', 'Morcolla', 'Paico', 'San Pedro de Larcay', 'San Salvador de Quije', 'Santiago de Paucaray', 'Soras']
    },
    {
      nombre: 'Víctor Fajardo',
      distritos: ['Huancapi', 'Alcamenca', 'Apongo', 'Asquipata', 'Canaria', 'Cayara', 'Colca', 'Huamanquiquia', 'Huancaraylla', 'Sancos', 'Sarhua', 'Vilcanchos']
    },
    {
      nombre: 'Vilcas Huamán',
      distritos: ['Vilcas Huamán', 'Accomarca', 'Carhuanca', 'Concepción', 'Huambalpa', 'Independencia', 'Saurama', 'Vischongo']
    }
  ],
  'Cajamarca': [
    {
      nombre: 'Cajamarca',
      distritos: ['Cajamarca', 'Asunción', 'Chetilla', 'Cospán', 'Encañada', 'Jesús', 'Llacanora', 'Los Baños del Inca', 'Magdalena', 'Matara', 'Namora', 'San Juan']
    },
    {
      nombre: 'Cajabamba',
      distritos: ['Cajabamba', 'Cachachi', 'Condebamba', 'Sitacocha']
    },
    {
      nombre: 'Celendín',
      distritos: ['Celendín', 'Chumuch', 'Cortegana', 'Huasmin', 'Jorge Chávez', 'José Gálvez', 'Miguel Iglesias', 'Huasmin', 'Oxamarca', 'Sorochuco', 'Sucre', 'Utco', 'La Libertad de Pallán']
    },
    {
      nombre: 'Chota',
      distritos: ['Chota', 'Anguía', 'Chadin', 'Chalamarca', 'Chiguirip', 'Chimban', 'Choropampa', 'Cochabamba', 'Conchan', 'Huambos', 'Lajas', 'Llama', 'Miracosta', 'Paccha', 'Pion', 'Querocoto', 'San Juan de Licupis', 'Tacabamba', 'Tocmoche']
    },
    {
      nombre: 'Contumazá',
      distritos: ['Contumazá', 'Chilete', 'Cupisnique', 'Guzmango', 'San Benito', 'Santa Cruz de Toledo', 'Tantarica', 'Yonan']
    },
    {
      nombre: 'Cutervo',
      distritos: ['Cutervo', 'Callayuc', 'Choros', 'Cujillo', 'La Ramada', 'Pimpingos', 'Querocotillo', 'San Andrés de Cutervo', 'San Juan de Cutervo', 'San Luis de Lucma', 'Santa Cruz', 'Santo Domingo de la Capilla', 'Santo Tomás', 'Sócota', 'Toribio Casanova']
    },
    {
      nombre: 'Hualgayoc',
      distritos: ['Bambamarca', 'Chugur', 'Hualgayoc']
    },
    {
      nombre: 'Jaén',
      distritos: ['Jaén', 'Bellavista', 'Chontali', 'Colasay', 'Huabal', 'Las Pirias', 'Pomahuaca', 'Pucará', 'Sallique', 'San Felipe', 'San José del Alto', 'Santa Rosa']
    },
    {
      nombre: 'San Ignacio',
      distritos: ['San Ignacio', 'Chirinos', 'Huarango', 'La Coipa', 'Namballe', 'San José de Lourdes', 'Tabaconas']
    },
    {
      nombre: 'San Marcos',
      distritos: ['Pedro Gálvez', 'Chancay', 'Eduardo Villanueva', 'Gregorio Pita', 'Ichocán', 'José Manuel Quiroz', 'José Sabogal']
    },
    {
      nombre: 'San Miguel',
      distritos: ['San Miguel', 'Bolívar', 'Calquis', 'Catilluc', 'El Prado', 'La Florida', 'Llapa', 'Nanchoc', 'Niepos', 'San Gregorio', 'San Silvestre de Cochán', 'Tongod', 'Unión Agua Blanca']
    },
    {
      nombre: 'San Pablo',
      distritos: ['San Pablo', 'San Bernardino', 'San Luis', 'Tumbaden']
    },
    {
      nombre: 'Santa Cruz',
      distritos: ['Santa Cruz', 'Andabamba', 'Catache', 'Chancaybaños', 'La Esperanza', 'Ninabamba', 'Pulan', 'Saucepampa', 'Sexi', 'Uticyacu', 'Yauyucan']
    }
  ],
  'Callao': [
    {
      nombre: 'Callao',
      distritos: ['Bellavista', 'Callao', 
                  'Carmen de la Legua Reynoso',
                  'La Perla', 'La Punta', 'Ventanilla', 'Mi Perú']
    }
  ],
  'Cusco': [
    {
      nombre: 'Cusco',
      distritos: ['Cusco', 'Ccorca', 'Poroy', 'San Jerónimo', 'San Sebastián', 'Santiago', 'Saylla', 'Wanchaq']
    },
    {
      nombre: 'Acomayo',
      distritos: ['Acomayo', 'Acopia', 'Acos', 'Mosoc Llacta', 'Pomacanchi', 'Rondocan', 'Sangarará']
    },
    {
      nombre: 'Anta',
      distritos: ['Anta', 'Ancahuasi', 'Cachimayo', 'Chinchaypuquio', 'Huarocondo', 'Limatambo', 'Mollepata', 'Pucyura', 'Zurite']
    },
    {
      nombre: 'Calca',
      distritos: ['Calca', 'Coya', 'Lamay', 'Lares', 'Pisac', 'San Salvador', 'Taray', 'Yanatile']
    },
    {
      nombre: 'Canas',
      distritos: ['Yanaoca', 'Checca', 'Kunturkanki', 'Langui', 'Layo', 'Pampamarca', 'Quehue', 'Túpac Amaru']
    },
    {
      nombre: 'Canchis',
      distritos: ['Sicuani', 'Checacupe', 'Combapata', 'Marangani', 'Pitumarca', 'San Pablo', 'San Pedro', 'Tinta']
    },
    {
      nombre: 'Chumbivilcas',
      distritos: ['Santo Tomás', 'Capacmarca', 'Chamaca', 'Colquemarca', 'Livitaca', 'Llusco', 'Quiñota', 'Velille']
    },
    {
      nombre: 'Espinar',
      distritos: ['Yauri', 'Condoroma', 'Coporaque', 'Ocoruro', 'Pallpata', 'Pichigua', 'Suyckutambo', 'Alto Pichigua']
    },
    {
      nombre: 'La Convención',
      distritos: ['Santa Ana', 'Echarate', 'Huayopata', 'Maranura', 'Ocobamba', 'Quellouno', 'Quimbiri', 'Santa Teresa', 'Vilcabamba', 'Pichari', 'Inkawasi', 'Villa Virgen', 'Villa Kintiarina', 'Megantoni']
    },
    {
      nombre: 'Paruro',
      distritos: ['Paruro', 'Accha', 'Ccapi', 'Colcha', 'Huanoquite', 'Omacha', 'Paccaritambo', 'Pillpinto', 'Yaurisque']
    },
    {
      nombre: 'Paucartambo',
      distritos: ['Paucartambo', 'Caicay', 'Challabamba', 'Colquepata', 'Huancarani', 'Kosñipata']
    },
    {
      nombre: 'Quispicanchi',
      distritos: ['Urcos', 'Andahuaylillas', 'Camanti', 'Ccarhuayo', 'Ccatca', 'Cusipata', 'Huaro', 'Lucre', 'Marcapata', 'Ocongate', 'Oropesa', 'Quiquijana']
    },
    {
      nombre: 'Urubamba',
      distritos: ['Urubamba', 'Chinchero', 'Huayllabamba', 'Machupicchu', 'Maras', 'Ollantaytambo', 'Yucay']
    }
  ],
  'Huancavelica': [
    {
      nombre: 'Huancavelica',
      distritos: [
        'Huancavelica', 'Acobambilla', 'Acoria', 'Conayca', 'Cuenca', 'Huachocolpa',
        'Huayllahuara', 'Izcuchaca', 'Laria', 'Manta', 'Mariscal Cáceres', 'Moya',
        'Nuevo Occoro', 'Palca', 'Pilchaca', 'Vilca', 'Yauli', 'Ascensión'
      ]
    },
    {
      nombre: 'Acobamba',
      distritos: ['Acobamba', 'Andabamba', 'Anta', 'Caja', 'Marcas', 'Paucará', 'Pomacocha', 'Rosario']
    },
    {
      nombre: 'Angaraes',
      distritos: ['Lircay', 'Anchonga', 'Callanmarca', 'Congalla', 'Chincho', 'Huayllay Grande', 'Huanca-Huanca', 'Julcamarca', 'San Antonio de Antaparco', 'Santo Tomás de Pata', 'Secclla', 'Ccochaccasa']
    },
    {
      nombre: 'Castrovirreyna',
      distritos: [
        'Castrovirreyna', 'Arma', 'Aurahuá', 'Capillas', 'Chupamarca', 'Cocas',
        'Huachos', 'Huamatambo', 'Mollepampa', 'San Juan', 'Santa Ana', 'Tantara', 'Ticrapo'
      ]
    },
    {
      nombre: 'Churcampa',
      distritos: ['Churcampa', 'Anco', 'Chinchihuasi', 'El Carmen', 'La Merced', 'Locroja', 'Paucarbamba', 'San Miguel de Mayocc', 'San Pedro de Coris', 'Pachamarca', 'Cosme']
    },
    {
      nombre: 'Huaytará',
      distritos: [
        'Huaytará', 'Ayaví', 'Córdova', 'Huayacundo Arma', 'Laramarca', 'Ocoyo',
        'Pilpichaca', 'Querco', 'Quito-Arma', 'San Antonio de Cusicancha', 'San Francisco de Sangayaico',
        'San Isidro', 'Santiago de Chocorvos', 'Santiago de Quirahuara', 'Santo Domingo de Capillas', 'Tambo'
      ]
    },
    {
      nombre: 'Tayacaja',
      distritos: [
        'Pampas', 'Acraquia', 'Ahuaycha', 'Colcabamba', 'Daniel Hernández', 'Huachocolpa',
        'Huaribamba', 'Ñahuimpuquio', 'Pazos', 'Quishuar', 'Salcabamba', 'Salcahuasi',
        'San Marcos de Rocchac', 'Surcubamba', 'Tintay Puncu', 'Quichuas', 'Andaymarca',
        'Roble', 'Pichos', 'Santiago de Tucuma'
      ]
    }
  ],
  'Huánuco': [
    {
      nombre: 'Huánuco',
      distritos: ['Huánuco', 'Amarilis', 'Chinchao', 'Churubamba', 'Margos', 'Quisqui', 'San Francisco de Cayrán', 'San Pedro de Chaulán', 'Santa María del Valle', 'Yarumayo', 'Pillco Marca', 'Yacus']
    },
    {
      nombre: 'Ambo',
      distritos: ['Ambo', 'Cayna', 'Colpas', 'Conchamarca', 'Huácar', 'San Francisco', 'San Rafael', 'Tomay Kichwa']
    },
    {
      nombre: 'Dos de Mayo',
      distritos: ['La Unión', 'Chuquis', 'Marías', 'Pachas', 'Quivilla', 'Ripan', 'Shunqui', 'Sillapata', 'Yanas']
    },
    {
      nombre: 'Huacaybamba',
      distritos: ['Huacaybamba', 'Canchabamba', 'Cochabamba', 'Pinra']
    },
    {
      nombre: 'Huamalíes',
      distritos: ['Llata', 'Arancay', 'Chavín de Pariarca', 'Jacas Grande', 'Jircan', 'Monzón', 'Punchao', 'Puños', 'Singa', 'Tantamayo', 'Jacas Chico']
    },
    {
      nombre: 'Leoncio Prado',
      distritos: ['Tingo María', 'Daniel Alomía Robles', 'Hermilio Valdizán', 'José Crespo y Castillo', 'Luyando', 'Mariano Dámaso Beraún', 'Pucayacu', 'Castillo Grande', 'Santo Domingo de Anda']
    },
    {
      nombre: 'Marañón',
      distritos: ['Huacrachuco', 'Chonlan', 'San Buenaventura', 'La Morada', 'Santa Rosa de Alto Yanajanca']
    },
    {
      nombre: 'Pachitea',
      distritos: ['Panao', 'Chaglla', 'Molino', 'Umari']
    },
    {
      nombre: 'Puerto Inca',
      distritos: ['Puerto Inca', 'Codo del Pozuzo', 'Honoria', 'Puerto Yuyapichis', 'Tournavista']
    },
    {
      nombre: 'Lauricocha',
      distritos: ['Jesús', 'Baños', 'Jivia', 'Queropalca', 'San Francisco de Asís', 'San Miguel de Cauri', 'Rondos']
    },
    {
      nombre: 'Yarowilca',
      distritos: ['Chavinillo', 'Cahuac', 'Chacabamba', 'Aparicio Pomares', 'Jacas Chico', 'Obas', 'Pampamarca', 'Choras']
    }
  ],
  'Ica': [
    {
      nombre: 'Ica',
      distritos: [
        'Ica', 'La Tinguiña', 'Los Aquijes', 'Ocucaje', 'Pachacútec', 'Parcona',
        'Pueblo Nuevo', 'Salas', 'San José de los Molinos', 'San Juan Bautista',
        'Santiago', 'Subtanjalla', 'Tate', 'Yauca del Rosario'
      ]
    },
    {
      nombre: 'Chincha',
      distritos: [
        'Chincha Alta', 'Alto Larán', 'Chavín', 'Chincha Baja', 'El Carmen',
        'Grocio Prado', 'Pueblo Nuevo', 'San Juan de Yanac', 'San Pedro de Huacarpana',
        'Sunampe', 'Tambo de Mora'
      ]
    },
    {
      nombre: 'Nasca',
      distritos: ['Nasca', 'Changuillo', 'El Ingenio', 'Marcona', 'Vista Alegre']
    },
    {
      nombre: 'Palpa',
      distritos: ['Palpa', 'Llipata', 'Río Grande', 'Santa Cruz', 'Tibillo']
    },
    {
      nombre: 'Pisco',
      distritos: [
        'Pisco', 'Huancano', 'Humay', 'Independencia', 'Paracas',
        'San Andrés', 'San Clemente', 'Túpac Amaru Inca'
      ]
    }
  ],
  'Junín': [
    {
      nombre: 'Huancayo',
      distritos: ['Huancayo', 'Carhuacallanga', 'Chacapampa', 'Chicche', 'Chilca', 'Chongos Alto', 'Chupuro', 'Colca', 'Cullhuas', 'El Tambo', 'Huacrapuquio', 'Hualhuas', 'Huancán', 'Huasicancha', 'Huayucachi', 'Ingenio', 'Pariahuanca', 'Pilcomayo', 'Quichuay', 'Quilcas', 'San Agustín', 'San Jerónimo de Tunán', 'Saño', 'Sapallanga', 'Sicaya', 'Viques']
    },
    {
      nombre: 'Chanchamayo',
      distritos: ['Chanchamayo', 'Perené', 'Pichanaqui', 'San Luis de Shuaro', 'San Ramón', 'Vitoc']
    },
    {
      nombre: 'Chupaca',
      distritos: ['Chupaca', 'Ahuac', 'Chongos Bajo', 'Huáchac', 'Huamancaca Chico', 'San Juan de Iscos', 'San Juan de Jarpa', 'Tres de Diciembre', 'Yanacancha']
    },
    {
      nombre: 'Concepción',
      distritos: ['Concepción', 'Aco', 'Andamarca', 'Chambara', 'Cochas', 'Comas', 'Heroínas Toledo', 'Manzanares', 'Mariscal Castilla', 'Matahuasi', 'Mito', 'Nueve de Julio', 'Orcotuna', 'San José de Quero', 'Santa Rosa de Ocopa']
    },
    {
      nombre: 'Jauja',
      distritos: ['Jauja', 'Acolla', 'Apata', 'Ataura', 'Canchayllo', 'Curicaca', 'El Mantaro', 'Huamali', 'Huaripampa', 'Huertas', 'Janjaillo', 'Leonor Ordóñez', 'Llocllapampa', 'Marco', 'Masma', 'Masma Chicche', 'Molinos', 'Monobamba', 'Muqui', 'Muquiyauyo', 'Paca', 'Paccha', 'Pancán', 'Parco', 'Pomacancha', 'Ricrán', 'San Lorenzo', 'San Pedro de Chunán', 'Sausa', 'Sincos', 'Tunan Marca', 'Yauli', 'Yauyos']
    },
    {
      nombre: 'Junín',
      distritos: ['Junín', 'Carhuamayo', 'Ondores', 'Ulcumayo']
    },
    {
      nombre: 'Satipo',
      distritos: ['Satipo', 'Coviriali', 'Llaylla', 'Mazamari', 'Pampa Hermosa', 'Pangoa', 'Río Negro', 'Río Tambo', 'Vizcatán del Ene']
    },
    {
      nombre: 'Tarma',
      distritos: ['Tarma', 'Acobamba', 'Huaricolca', 'Huasahuasi', 'La Unión', 'Palca', 'Palcamayo', 'San Pedro de Cajas', 'Tapo']
    },
    {
      nombre: 'Yauli',
      distritos: ['La Oroya', 'Chacapalpa', 'Huay-Huay', 'Marcapomacocha', 'Morococha', 'Paccha', 'Santa Bárbara de Carhuacayán', 'Santa Rosa de Sacco', 'Suitucancha', 'Yauli']
    }
  ],
  'La Libertad': [
    {
      nombre: 'Trujillo',
      distritos: ['Trujillo', 'El Porvenir', 'Florencia de Mora', 'Huanchaco', 'La Esperanza', 'Laredo', 'Moche', 'Poroto', 'Salaverry', 'Simbal', 'Víctor Larco Herrera']
    },
    {
      nombre: 'Ascope',
      distritos: ['Ascope', 'Chicama', 'Chocope', 'Magdalena de Cao', 'Paiján', 'Rázuri', 'Santiago de Cao', 'Casa Grande']
    },
    {
      nombre: 'Bolívar',
      distritos: ['Bolívar', 'Bambamarca', 'Condormarca', 'Longotea', 'Uchumarca', 'Ucuncha']
    },
    {
      nombre: 'Chepén',
      distritos: ['Chepén', 'Pacanga', 'Pueblo Nuevo']
    },
    {
      nombre: 'Gran Chimú',
      distritos: ['Cascas', 'Lucma', 'Marmot', 'Sayapullo']
    },
    {
      nombre: 'Julcán',
      distritos: ['Julcán', 'Calamarca', 'Carabamba', 'Huaso']
    },
    {
      nombre: 'Otuzco',
      distritos: ['Otuzco', 'Agallpampa', 'Charat', 'Huaranchal', 'La Cuesta', 'Mache', 'Paranday', 'Salpo', 'Sinsicap', 'Usquil']
    },
    {
      nombre: 'Pacasmayo',
      distritos: ['San Pedro de Lloc', 'Guadalupe', 'Jequetepeque', 'Pacasmayo', 'San José']
    },
    {
      nombre: 'Pataz',
      distritos: ['Tayabamba', 'Buldibuyo', 'Chillia', 'Huancaspata', 'Huaylillas', 'Huayo', 'Ongón', 'Parcoy', 'Pataz', 'Pías', 'Santiago de Challas', 'Taurija', 'Urpay']
    },
    {
      nombre: 'Sánchez Carrión',
      distritos: ['Huamachuco', 'Chugay', 'Curgos', 'Marcabal', 'Sanagorán', 'Sarin', 'Sartimbamba', 'Cochorco']
    },
    {
      nombre: 'Santiago de Chuco',
      distritos: ['Santiago de Chuco', 'Angasmarca', 'Cachicadán', 'Mollebamba', 'Mollepata', 'Quiruvilca', 'Santa Cruz de Chuca', 'Sitabamba']
    },
    {
      nombre: 'Virú',
      distritos: ['Virú', 'Chao', 'Guadalupito']
    }
  ],
  'Lambayeque': [
    {
      nombre: 'Chiclayo',
      distritos: [
        'Chiclayo', 'Chongoyape', 'Eten', 'Eten Puerto', 'José Leonardo Ortiz',
        'La Victoria', 'Lagunas', 'Monsefú', 'Nueva Arica', 'Oyotún',
        'Picsi', 'Pimentel', 'Reque', 'Santa Rosa', 'Saña', 'Cayaltí',
        'Patapo', 'Pomalca', 'Pucalá', 'Tumán'
      ]
    },
    {
      nombre: 'Lambayeque',
      distritos: [
        'Lambayeque', 'Chochope', 'Illimo', 'Jayanca', 'Mochumí', 'Mórrope',
        'Motupe', 'Olmos', 'Pacora', 'Salas', 'San José', 'Túcume'
      ]
    },
    {
      nombre: 'Ferreñafe',
      distritos: ['Ferreñafe', 'Cañaris', 'Incahuasi', 'Manuel Antonio Mesones Muro', 'Pitipo', 'Pueblo Nuevo']
    }
  ],
  'Lima': [
    {
      nombre: 'Lima Metropolitana',
      distritos: [
        'Ancón', 'Ate', 'Barranco', 'Breña', 'Carabayllo', 'Chaclacayo','Chorrillos', 'Cieneguilla', 'Comas', 'El Agustino', 'Independencia','Jesús María', 'La Molina', 'La Victoria', 'Lima', 'Lince','Los Olivos', 'Lurigancho-Chosica', 'Lurín', 'Magdalena del Mar','Miraflores', 'Pachacámac', 'Pucusana', 'Pueblo Libre', 'Puente Piedra','Punta Hermosa', 'Punta Negra', 'Rímac', 'San Bartolo', 'San Borja','San Isidro', 'San Juan de Lurigancho', 'San Juan de Miraflores','San Luis', 'San Martín de Porres', 'San Miguel', 'Santa Anita','Santa María del Mar', 'Santa Rosa', 'Santiago de Surco', 'Surquillo','Villa El Salvador', 'Villa María del Triunfo'
      ],
    },
    {
      nombre: 'Barranca',
      distritos: ['Barranca','Paramonga', 'Pativilca','Supe', 'Supe Puerto'],
    },
    {
      nombre: 'Canta',
      distritos: ['Canta', 'Arahuay', 'Huamantanga', 'Huaros', 'La Pampa', 'Mangas', 'Pisac', 'Santa Ana', 'Tuburí'],
    },
    {
      nombre: 'Cajatambo',
      distritos: ['Cajatambo', 'Copa', 'Gorgor', 'Huancapon', 'Manas'],
    },
    {
      nombre: 'Cañete',
      distritos: [
        'San Vicente de Cañete', 'Asia', 'Calango', 'Cerro Azul', 'Chilca', 'Coayllo','Imperial', 'Lunahuaná', 'Mala', 'Nuevo Imperial', 'Pacarán', 'Quilmaná','San Antonio', 'San Luis', 'Santa Cruz de Flores', 'Zúñiga'
      ],
    },
    {
      nombre: 'Huaral',
      distritos: [
        'Huaral', 'Atavillos Alto', 'Atavillos Bajo', 'Aucallama', 'Chancay', 'Ihuari',
        'Lampián', 'Pacaraos', 'Santa Cruz de Andamarca', 'Sumbilca'
      ],
    },
    {
      nombre: 'Huarochirí',
      distritos: [
        'Matucana', 'Antioquia', 'Callahuanca', 'Carampoma', 'Chicla', 'Cuenca',
        'Huachupampa', 'Huanza', 'Huarochirí', 'Lahuaytambo', 'Langa', 'Laraos', 
        'Mariatana', 'Ricardo Palma', 'San Andrés de Tupicocha', 'San Antonio', 
        'San Bartolomé', 'San Damián', 'San Juan de Iris',
        'San Juan de Tantaranche', 'San Lorenzo de Quinti', 'San Mateo',
        'San Mateo de Otao', 'San Pedro de Casta', 'San Pedro de Huancayre',
        'Sangallaya', 'Santa Cruz de Cocachacra', 'Santa Eulalia', 'Santiago de Anchucaya', 
        'Santiago de Tuna', 'Santo Domingo de los Olleros', 'Surco'
      ],
    },
    {
      nombre: 'Huaura',
      distritos: [
        'Huacho', 'Ámbar', 'Caleta de Carquín', 'Checras', 'Hualmay', 'Huaura',
        'Leoncio Prado', 'Paccho', 'Santa Leonor', 'Santa María', 'Sayán' , 'Végueta'
      ],
    },
    {
      nombre: 'Oyón',
      distritos: ['Oyón', 'Andajes', 'Caujul', 'Cochamarca', 'Naván', 'Pachangara'],
    },
    {
      nombre: 'Yauyos',
      distritos: [
        'Yauyos', 'Alis', 'Ayauca', 'Ayaviri', 'Azángaro', 'Cacra',
        'Carania', 'Catahuasi', 'Chocos', 'Cochas', 'Colonia', 'Hongos',
        'Huámpara', 'Huancaya', 'Huangáscar', 'Huantán', 'Huañec', 'Laraos',
        'Lincha', 'Madeán', 'Miraflores', 'Omas', 'Putinza', 'Quinches',
        'Quinocay', 'San Joaquín', 'San Pedro de Pilas', 'Tanta', 'Tauripampa', 'Tomas',
        'Tupe', 'Viñac', 'Vitis'
      ],
    },

  ],
  'Loreto': [
    {
      nombre: 'Maynas',
      distritos: ['Iquitos', 'Alto Nanay', 'Fernando Lores', 'Indiana', 'Las Amazonas', 'Mazan', 'Napo', 'Punchana', 'Torres Causana', 'Belén', 'San Juan Bautista']
    },
    {
      nombre: 'Alto Amazonas',
      distritos: ['Yurimaguas', 'Balsapuerto', 'Jeberos', 'Lagunas', 'Santa Cruz', 'Teniente César López Rojas']
    },
    {
      nombre: 'Loreto',
      distritos: ['Nauta', 'Parinari', 'Tigre', 'Trompeteros', 'Urarinas']
    },
    {
      nombre: 'Mariscal Ramón Castilla',
      distritos: ['Ramón Castilla', 'Pebas', 'Yavari', 'San Pablo']
    },
    {
      nombre: 'Requena',
      distritos: ['Requena', 'Alto Tapiche', 'Capelo', 'Emilio San Martín', 'Maquia', 'Puinahua', 'Saquena', 'Soplin', 'Tapiche', 'Jenaro Herrera', 'Yaquerana']
    },
    {
      nombre: 'Ucayali',
      distritos: ['Contamana', 'Inahuaya', 'Padre Márquez', 'Pampa Hermosa', 'Sarayacu', 'Vargas Guerra']
    },
    {
      nombre: 'Datem del Marañón',
      distritos: ['Barranca', 'Cahuapanas', 'Manseriche', 'Morona', 'Pastaza', 'Andoas']
    },
    {
      nombre: 'Putumayo',
      distritos: ['Putumayo', 'Rosa Panduro', 'Teniente Manuel Clavero', 'Yaguas']
    }
  ],
  'Madre de Dios': [
    {
      nombre: 'Tambopata',
      distritos: ['Puerto Maldonado', 'Inambari', 'Las Piedras', 'Laberinto']
    },
    {
      nombre: 'Manu',
      distritos: ['Manu', 'Fitzcarrald', 'Madre de Dios', 'Huepetuhe']
    },
    {
      nombre: 'Tahuamanu',
      distritos: ['Iñapari', 'Iberia', 'Tahuamanu']
    }
  ],
  'Moquegua': [
    {
      nombre: 'Mariscal Nieto',
      distritos: ['Moquegua', 'Carumas', 'Cuchumbaya', 'Samegua', 'San Cristóbal', 'Torata']
    },
    {
      nombre: 'General Sánchez Cerro',
      distritos: [
        'Omate', 'Chojata', 'Coalaque', 'Ichuña', 'La Capilla', 'Lloque', 
        'Matalaque', 'Puquina', 'Quinistaquillas', 'Ubinas', 'Yunga'
      ]
    },
    {
      nombre: 'Ilo',
      distritos: ['Ilo', 'El Algarrobal', 'Pacocha']
    }
  ],
  'Pasco': [
    {
      nombre: 'Pasco',
      distritos: [
        'Chaupimarca', 'Huachón', 'Huariaca', 'Huayllay', 'Ninacaca', 'Pallanchacra', 
        'Paucartambo', 'San Francisco de Asís de Yurusyacán', 'Simón Bolívar', 'Ticlacayán', 'Tinyahuarco', 'Vicco'
      ]
    },
    {
      nombre: 'Daniel Alcides Carrión',
      distritos: ['Yanahuanca', 'Chacayán', 'Goyllarisquizga', 'Paucar', 'San Pedro de Pillao', 'Santa Ana de Tusi', 'Tapuc', 'Vilcabamba']
    },
    {
      nombre: 'Oxapampa',
      distritos: ['Oxapampa', 'Chontabamba', 'Constitución', 'Huancabamba', 'Palcazú', 'Pozuzo', 'Puerto Bermúdez', 'Villa Rica']
    }
  ],
  'Piura': [
    {
      nombre: 'Piura',
      distritos: ['Piura', 'Castilla', 'Catacaos', 'Cura Mori', 'El Tallán', 'La Arena', 'La Unión', 'Las Lomas', 'Tambo Grande', 'Veintiséis de Octubre']
    },
    {
      nombre: 'Ayabaca',
      distritos: ['Ayabaca', 'Frias', 'Jililí', 'Lagunas', 'Montero', 'Pacaipampa', 'Paimas', 'Sapillica', 'Sicchez', 'Suyo']
    },
    {
      nombre: 'Huancabamba',
      distritos: ['Huancabamba', 'Canchaque', 'El Carmen de la Frontera', 'Huarmaca', 'Lalaquiz', 'San Miguel de El Faique', 'Sondor', 'Sondorillo']
    },
    {
      nombre: 'Morropón',
      distritos: ['Chulucanas', 'Buenos Aires', 'Chalaco', 'La Matanza', 'Morropón', 'Salitral', 'San Juan de Bigote', 'Santa Catalina de Mossa', 'Santo Domingo', 'Yamango']
    },
    {
      nombre: 'Paita',
      distritos: ['Paita', 'Amotape', 'Arenal', 'Colán', 'La Huaca', 'Tamarindo', 'Vichayal']
    },
    {
      nombre: 'Sullana',
      distritos: ['Sullana', 'Bellavista', 'Ignacio Escudero', 'Lancones', 'Marcavelica', 'Miguel Checa', 'Querecotillo', 'Salitral']
    },
    {
      nombre: 'Talara',
      distritos: ['Pariñas', 'El Alto', 'La Brea', 'Lobitos', 'Los Órganos', 'Máncora']
    },
    {
      nombre: 'Sechura',
      distritos: ['Sechura', 'Bellavista de la Unión', 'Bernal', 'Cristo Nos Valga', 'Vice', 'Rincón de Olmos']
    }
  ],
  'Puno': [
    {
      nombre: 'Puno',
      distritos: ['Puno', 'Acora', 'Atuncolla', 'Capachica', 'Coata', 'Chucuito', 'Mañazo', 'Paucarcolla', 'Pichacani', 'Platería', 'San Antonio', 'Tiquillaca', 'Vilque', 'Mañazo']
    },
    {
      nombre: 'Azángaro',
      distritos: ['Azángaro', 'Achaya', 'Arapa', 'Asillo', 'Caminaca', 'Chupa', 'José Domingo Choquehuanca', 'Muñani', 'Potoni', 'Saman', 'San Antón', 'San José', 'San Juan de Salinas', 'Santiago de Pupuja', 'Tirapata']
    },
    {
      nombre: 'Carabaya',
      distritos: ['Macusani', 'Ajoyani', 'Ayapata', 'Coasa', 'Corani', 'Crucero', 'Ituata', 'Ollachea', 'San Gabán', 'Usicayos']
    },
    {
      nombre: 'Chucuito',
      distritos: ['Juli', 'Desaguadero', 'Huacullani', 'Kelluyo', 'Pisacoma', 'Pomata', 'Zepita']
    },
    {
      nombre: 'El Collao',
      distritos: ['Ilave', 'Capazo', 'Conduriri', 'Santa Rosa', 'Pilcuyo']
    },
    {
      nombre: 'Huancané',
      distritos: ['Huancané', 'Cojata', 'Huatasani', 'Pusi', 'Rosaspata', 'Taraco', 'Vilque Chico']
    },
    {
      nombre: 'Lampa',
      distritos: ['Lampa', 'Cabanilla', 'Calapuja', 'Nicasio', 'Ocuviri', 'Palca', 'Paratía', 'Pucará', 'Santa Lucía', 'Vilavila']
    },
    {
      nombre: 'Melgar',
      distritos: ['Ayaviri', 'Antauta', 'Cupi', 'Llalli', 'Macari', 'Nuñoa', 'Orurillo', 'Santa Rosa', 'Umachiri']
    },
    {
      nombre: 'Moho',
      distritos: ['Moho', 'Conima', 'Tilali']
    },
    {
      nombre: 'San Antonio de Putina',
      distritos: ['Putina', 'Ananea', 'Pedro Vilca Apaza', 'Quilcapuncu', 'Sina']
    },
    {
      nombre: 'San Román',
      distritos: ['Juliaca', 'Cabana', 'Cabanillas', 'Caracoto', 'San Miguel']
    },
    {
      nombre: 'Sandia',
      distritos: ['Sandia', 'Cuyocuyo', 'Limbani', 'Patambuco', 'Phara', 'Quiaca', 'San Juan del Oro', 'Yanahuaya', 'Alto Inambari', 'San Pedro de Putina Punco']
    },
    {
      nombre: 'Yunguyo',
      distritos: ['Yunguyo', 'Anapia', 'Copani', 'Cuturapi', 'Ollaraya', 'Tinicachi', 'Unicachi']
    }
  ],
  'San Martín': [
    {
      nombre: 'Moyobamba',
      distritos: ['Moyobamba', 'Calzada', 'Habana', 'Jepelacio', 'Soritor', 'Yantalo']
    },
    {
      nombre: 'Bellavista',
      distritos: ['Bellavista', 'Alto Biavo', 'Bajo Biavo', 'Huallaga', 'Mazamari', 'San Pablo', 'San Rafael']
    },
    {
      nombre: 'El Dorado',
      distritos: ['San José de Sisa', 'Agua Blanca', 'San Martín', 'Santa Rosa', 'Shatoja']
    },
    {
      nombre: 'Huallaga',
      distritos: ['Saposoa', 'Alto Saposoa', 'Eslabón', 'Piscoyacu', 'Sacanche', 'Tingo de Saposoa']
    },
    {
      nombre: 'Lamas',
      distritos: ['Lamas', 'Alonso de Alvarado', 'Barranquita', 'Caynarachi', 'Cuñumbuqui', 'Pinto Recodo', 'Rumisapa', 'San Roque de Cumbaza', 'Shanao', 'Tabalosos', 'Zapatero']
    },
    {
      nombre: 'Mariscal Cáceres',
      distritos: ['Juanjuí', 'Campanilla', 'Huicungo', 'Pachiza', 'Pajarillo']
    },
    {
      nombre: 'Picota',
      distritos: ['Picota', 'Buenos Aires', 'Caspisapa', 'Pilluana', 'Pucacaca', 'San Cristóbal', 'San Hilarión', 'Shamboyacu', 'Tingo de Ponasa', 'Tres Unidos']
    },
    {
      nombre: 'Rioja',
      distritos: ['Rioja', 'Awajún', 'Elias Soplin Vargas', 'Nueva Cajamarca', 'Pardo Miguel', 'Posic', 'San Fernando', 'Yorongos', 'Yuracyacu']
    },
    {
      nombre: 'San Martín',
      distritos: ['Tarapoto', 'Alberto Leveau', 'Cacatachi', 'Chapaura', 'Chazuta', 'Chipurana', 'El Porvenir', 'Huimbayoc', 'Juan Guerra', 'Morales', 'Papaplaya', 'San Antonio', 'Sauce', 'Shapaja']
    },
    {
      nombre: 'Tocache',
      distritos: ['Tocache', 'Nuevo Progreso', 'Pólvora', 'Shunté', 'Uchiza']
    }
  ],
  'Tacna': [
    {
      nombre: 'Tacna',
      distritos: [
        'Tacna', 'Alto de la Alianza', 'Calana', 'Ciudad Nueva', 'Coronel Gregorio Albarracín Lanchipa',
        'Inclán', 'Pachía', 'Palca', 'Pocollay', 'Sama', 'La Yarada-Los Palos'
      ]
    },
    {
      nombre: 'Candarave',
      distritos: ['Candarave', 'Cairani', 'Camilaca', 'Curibaya', 'Huanuara', 'Quilahuani']
    },
    {
      nombre: 'Jorge Basadre',
      distritos: ['Locumba', 'Ilabaya', 'Ite']
    },
    {
      nombre: 'Tarata',
      distritos: ['Tarata', 'Chucatamani', 'Estique', 'Estique-Pampa', 'Sitajara', 'Susapaya', 'Ticaco', 'Tarucachi']
    }
  ],
  'Tumbes': [
    {
      nombre: 'Tumbes',
      distritos: ['Tumbes', 'Corrales', 'La Cruz', 'Pampas de Hospital', 'San Jacinto', 'San Juan de la Virgen']
    },
    {
      nombre: 'Contralmirante Villar',
      distritos: ['Zorritos', 'Casitas', 'Canoas de Punta Sal']
    },
    {
      nombre: 'Zarumilla',
      distritos: ['Zarumilla', 'Aguas Verdes', 'Matapalo', 'Papayal']
    }
  ],
  'Ucayali': [
    {
      nombre: 'Coronel Portillo',
      distritos: ['Pucallpa', 'Campoverde', 'Iparía', 'Masisea', 'Yarinacocha', 'Nueva Requena', 'Manantay', 'Sadhani']
    },
    {
      nombre: 'Atalaya',
      distritos: ['Atalaya', 'Sepahua', 'Tahuanía', 'Yurúa']
    },
    {
      nombre: 'Padre Abad',
      distritos: ['Aguaytía', 'Irazola', 'Curimaná', 'Neshuya', 'Alexander von Humboldt']
    },
    {
      nombre: 'Purús',
      distritos: ['Purús']
    }
  ],
};