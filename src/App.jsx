import { useState, useEffect, useRef } from 'react';
import { supabase } from './services/supabaseClient';
// ==================== UTILITÁRIOS =================
// ===
const gerarId = () => Date.now() + Math.random() * 1000;

// ==================== COMPONENTE DA CÂMERA ====================
const CameraComponent = ({ onClose, onCapture }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [error, setError] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
        });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        setError('Erro ao acessar a câmera: ' + err.message);
      }
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      const imageData = canvas.toDataURL('image/jpeg', 0.9);
      setCapturedImage(imageData);
      
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }
    }
  };

  const handleConfirm = () => {
    if (capturedImage) {
      onCapture(capturedImage);
      onClose();
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    const startCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        setError('Erro ao reiniciar a câmera: ' + err.message);
      }
    };
    startCamera();
  };

  if (error) {
    return (
      <div className="fixed inset-0 bg-black/90 z-[9999] flex items-center justify-center">
        <div className="bg-white p-8 rounded-2xl max-w-md text-center mx-4 shadow-2xl">
          <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-exclamation-triangle text-red-500 text-3xl"></i>
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">Erro na Câmera</h3>
          <p className="text-gray-600">{error}</p>
          <p className="text-sm text-gray-500 mt-4">
            💡 Permita o acesso à câmera no navegador
          </p>
          <button 
            onClick={onClose} 
            className="mt-6 bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/90 z-[9999] flex flex-col items-center justify-center">
      {capturedImage ? (
        <>
          <img 
            src={capturedImage} 
            alt="Foto capturada" 
            className="max-w-[90%] max-h-[70vh] rounded-2xl shadow-[0_0_50px_rgba(16,185,129,0.3)]" 
          />
          <div className="flex gap-4 mt-6">
            <button 
              onClick={handleRetake} 
              className="bg-red-500 hover:bg-red-600 text-white px-8 py-3 rounded-full font-bold transition-all hover:scale-105 flex items-center gap-2 shadow-lg"
            >
              <i className="fas fa-redo"></i>
              Tirar Novamente
            </button>
            <button 
              onClick={handleConfirm} 
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-3 rounded-full font-bold transition-all hover:scale-105 flex items-center gap-2 shadow-lg"
            >
              <i className="fas fa-check"></i>
              Adicionar ao Paciente
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="relative w-full max-w-4xl">
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted
              className="w-full rounded-2xl bg-black shadow-2xl"
            />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-24 h-24 border-4 border-emerald-500/50 rounded-full animate-pulse"></div>
            </div>
          </div>
          <canvas ref={canvasRef} className="hidden" />
          <div className="flex gap-4 mt-6">
            <button 
              onClick={onClose} 
              className="bg-red-500 hover:bg-red-600 text-white px-8 py-3 rounded-full font-bold transition-all hover:scale-105 flex items-center gap-2 shadow-lg"
            >
              <i className="fas fa-times"></i>
              Fechar
            </button>
            <button 
              onClick={capturePhoto} 
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-3 rounded-full font-bold transition-all hover:scale-105 flex items-center gap-2 shadow-lg"
            >
              <i className="fas fa-camera"></i>
              Tirar Foto
            </button>
          </div>
          <p className="text-white/70 text-sm mt-4">
            <i className="fas fa-info-circle mr-2"></i>
            Posicione o documento e clique em "Tirar Foto"
          </p>
        </>
      )}
    </div>
  );
};

// ==================== TELA DE LOGIN ====================
const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [isCadastro, setIsCadastro] = useState(false);
  const [nome, setNome] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');

  const handleLogin = async (e) => {
  e.preventDefault();
  setErro('');

  const { data, error } = await supabase
    .from('usuarios')
    .select('*')
    .eq('email', email)
    .eq('senha', senha)
    .single();

  if (error || !data) {
    setErro('E-mail ou senha incorretos');
    return;
  }

  onLogin(data);
};

 const handleCadastro = async (e) => {
  e.preventDefault();
  setErro('');

  if (!nome || !email || !senha || !confirmarSenha) {
    setErro('Preencha todos os campos');
    return;
  }

  if (senha !== confirmarSenha) {
    setErro('As senhas não coincidem');
    return;
  }

  if (senha.length < 6) {
    setErro('A senha deve ter pelo menos 6 caracteres');
    return;
  }

  const { data: usuarioExistente } = await supabase
    .from('usuarios')
    .select('id')
    .eq('email', email)
    .maybeSingle();

  if (usuarioExistente) {
    setErro('Este e-mail já está cadastrado');
    return;
  }

  const { data, error } = await supabase
    .from('usuarios')
    .insert([
      {
        nome: nome,
        email: email,
        senha: senha,
        tipo: 'admin'
      }
    ])
    .select()
    .single();

  if (error) {
    console.error('Erro ao cadastrar usuário:', error);
    setErro('Não foi possível cadastrar o usuário');
    return;
  }

  onLogin(data);
};

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 animate-fade-in">
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-full gradient-bg flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/30">
            <i className="fas fa-heartbeat text-white text-3xl"></i>
          </div>
          <h1 className="text-3xl font-bold text-gray-800">São Dridri</h1>
          <p className="text-gray-500 text-sm mt-1">Hospital & Clínica</p>
          <p className="text-gray-400 text-xs mt-2">
            {isCadastro ? 'Crie sua conta' : 'Faça login para acessar o sistema'}
          </p>
        </div>

        <form onSubmit={isCadastro ? handleCadastro : handleLogin} className="space-y-4">
          {isCadastro && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome Completo
              </label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                placeholder="Seu nome completo"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              E-mail
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
              placeholder="seu@email.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Senha
            </label>
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
              placeholder={isCadastro ? 'Mínimo 6 caracteres' : '********'}
              required
            />
          </div>

          {isCadastro && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirmar Senha
              </label>
              <input
                type="password"
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                placeholder="Digite novamente"
                required
              />
            </div>
          )}

          {erro && (
            <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm flex items-center gap-2">
              <i className="fas fa-exclamation-circle"></i>
              {erro}
            </div>
          )}

          <button
            type="submit"
            className="w-full gradient-bg text-white py-3 rounded-xl font-bold hover:scale-[1.02] transition-all shadow-lg shadow-emerald-500/30"
          >
            <i className={`fas fa-${isCadastro ? 'user-plus' : 'sign-in-alt'} mr-2`}></i>
            {isCadastro ? 'Criar Conta' : 'Entrar'}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            onClick={() => {
              setIsCadastro(!isCadastro);
              setErro('');
            }}
            className="text-sm text-emerald-500 hover:text-emerald-700 transition-colors"
          >
            {isCadastro ? 'Já tem uma conta? Faça login' : 'Não tem conta? Cadastre-se'}
          </button>
        </div>

        {!isCadastro && (
          <div className="mt-2 text-center">
            <p className="text-xs text-gray-400">
              Credenciais padrão: admin@saodridri.com / admin123
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// ==================== SIDEBAR ====================
const Sidebar = ({ activeTab, setActiveTab, isMobile, setIsMobile, onLogout }) => {
  const menuItems = [
    { id: 'dashboard', icon: 'fa-chart-pie', label: 'Dashboard' },
    { id: 'pacientes', icon: 'fa-users', label: 'Pacientes' },
    { id: 'agendamentos', icon: 'fa-calendar-check', label: 'Agendamentos' },
    { id: 'calendario', icon: 'fa-calendar-alt', label: 'Calendário' },
    { id: 'documentos', icon: 'fa-file-alt', label: 'Documentos' },
    { id: 'atendimentos', icon: 'fa-stethoscope', label: 'Atendimentos' },
    { id: 'mensagens', icon: 'fa-comments', label: 'Mensagens' },
    { id: 'relatorios', icon: 'fa-chart-bar', label: 'Relatórios' },
    { id: 'configuracoes', icon: 'fa-cog', label: 'Configurações' },
  ];

  return (
    <>
      {isMobile && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsMobile(false)}
        ></div>
      )}
      
      <aside className={`fixed top-0 left-0 h-full w-64 bg-white shadow-2xl z-50 sidebar-transition overflow-y-auto ${
        isMobile ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl gradient-bg flex items-center justify-center shadow-lg">
              <i className="fas fa-heartbeat text-white text-2xl"></i>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">São Dridri</h1>
              <p className="text-xs text-gray-500">Hospital & Clínica</p>
            </div>
          </div>
        </div>
        
        <nav className="p-4 space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                if (isMobile) setIsMobile(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                activeTab === item.id
                  ? 'gradient-bg text-white shadow-lg shadow-emerald-500/30'
                  : 'text-gray-600 hover:bg-emerald-50 hover:text-emerald-600'
              }`}
            >
              <i className={`fas ${item.icon} w-5 text-center`}></i>
              <span className="font-medium text-sm">{item.label}</span>
              {activeTab === item.id && (
                <div className="ml-auto w-1.5 h-8 bg-white rounded-full"></div>
              )}
            </button>
          ))}
        </nav>
        
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100 bg-white">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
            <div className="w-10 h-10 rounded-full gradient-bg flex items-center justify-center">
              <i className="fas fa-user-md text-white text-sm"></i>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-800 truncate">Administrador</p>
              <p className="text-xs text-gray-500">Online</p>
            </div>
            <button 
              onClick={onLogout}
              className="text-red-400 hover:text-red-600 transition-colors"
            >
              <i className="fas fa-sign-out-alt"></i>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

// ==================== STATS CARD ====================
const StatsCard = ({ icon, label, value, color, subtitle, change }) => {
  const colors = {
    emerald: 'bg-emerald-50 text-emerald-600',
    blue: 'bg-blue-50 text-blue-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    purple: 'bg-purple-50 text-purple-600',
    red: 'bg-red-50 text-red-600',
    pink: 'bg-pink-50 text-pink-600',
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm card-hover border border-gray-100">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{label}</p>
          <p className="text-3xl font-bold text-gray-800 mt-1">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
          )}
          {change && (
            <span className={`text-xs font-medium ${change.startsWith('+') ? 'text-emerald-600' : 'text-red-600'}`}>
              {change}
            </span>
          )}
        </div>
        <div className={`w-12 h-12 rounded-2xl ${colors[color]} flex items-center justify-center`}>
          <i className={`fas ${icon} text-xl`}></i>
        </div>
      </div>
    </div>
  );
};

// ==================== MODAL DE CADASTRO DE PACIENTE ====================
const CadastroPacienteModal = ({ onClose, onCadastrar }) => {
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    dataNascimento: '',
    endereco: '',
    cidade: '',
    estado: '',
    cep: '',
    convenio: '',
    alergias: '',
    medicacoes: '',
    observacoes: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.nome && formData.email && formData.telefone) {
      onCadastrar({
        ...formData,
        id: gerarId(),
        dataCadastro: new Date().toISOString(),
        historico: []
      });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8 shadow-2xl animate-fade-in">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              <i className="fas fa-user-plus text-emerald-500 mr-2"></i>
              Novo Paciente
            </h2>
            <p className="text-sm text-gray-500 mt-1">Preencha os dados do paciente</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl transition-colors">
            <i className="fas fa-times"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome Completo *
              </label>
              <input
                type="text"
                name="nome"
                value={formData.nome}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                placeholder="Digite o nome completo"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                E-mail *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                placeholder="paciente@email.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Telefone *
              </label>
              <input
                type="tel"
                name="telefone"
                value={formData.telefone}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                placeholder="(11) 99999-9999"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data de Nascimento
              </label>
              <input
                type="date"
                name="dataNascimento"
                value={formData.dataNascimento}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Endereço
            </label>
            <input
              type="text"
              name="endereco"
              value={formData.endereco}
              onChange={handleChange}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
              placeholder="Rua, número"
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cidade
              </label>
              <input
                type="text"
                name="cidade"
                value={formData.cidade}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                placeholder="São Paulo"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estado
              </label>
              <input
                type="text"
                name="estado"
                value={formData.estado}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                placeholder="SP"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CEP
              </label>
              <input
                type="text"
                name="cep"
                value={formData.cep}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                placeholder="00000-000"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Convênio
            </label>
            <input
              type="text"
              name="convenio"
              value={formData.convenio}
              onChange={handleChange}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
              placeholder="Nome do convênio"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Alergias
              </label>
              <input
                type="text"
                name="alergias"
                value={formData.alergias}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                placeholder="Ex: Penicilina, Amendoim..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Medicações em Uso
              </label>
              <input
                type="text"
                name="medicacoes"
                value={formData.medicacoes}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                placeholder="Medicamentos atuais"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Observações
            </label>
            <textarea
              name="observacoes"
              value={formData.observacoes}
              onChange={handleChange}
              rows="2"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all resize-none"
              placeholder="Informações adicionais..."
            />
          </div>

          <button
            type="submit"
            className="w-full gradient-bg text-white py-3 rounded-xl font-bold hover:scale-[1.02] transition-all shadow-lg shadow-emerald-500/30"
          >
            <i className="fas fa-check mr-2"></i>
            Cadastrar Paciente
          </button>
        </form>
      </div>
    </div>
  );
};

// ==================== MODAL DE AGENDAMENTO (com data automática) ====================
const AgendamentoModal = ({ onClose, onAgendar, pacientes, dataPadrao = '' }) => {
  const [formData, setFormData] = useState({
    pacienteId: '',
    tipoExame: '',
    data: dataPadrao || '',
    horario: '',
    medico: '',
    observacoes: ''
  });

  const tiposExame = [
    'Raio-X',
    'Ultrassom',
    'Ressonância Magnética',
    'Tomografia',
    'Mamografia',
    'Densitometria Óssea',
    'Eletrocardiograma',
    'Endoscopia',
    'Colonoscopia',
    'Exame de Sangue',
    'Outro'
  ];

  const medicos = [
    'Dr. Carlos Silva',
    'Dra. Ana Oliveira',
    'Dr. Roberto Santos',
    'Dra. Patricia Lima',
    'Dr. Marcos Ferreira'
  ];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.pacienteId && formData.tipoExame && formData.data && formData.horario) {
      // Buscar o paciente pelo ID (convertendo para número)
      const paciente = pacientes.find(p => p.id === Number(formData.pacienteId));
      onAgendar({
        ...formData,
        pacienteNome: paciente ? paciente.nome : 'Paciente não encontrado',
        pacienteId: Number(formData.pacienteId),
        id: gerarId(),
        status: 'Pendente',
        criadoEm: new Date().toISOString()
      });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8 shadow-2xl animate-fade-in">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              <i className="fas fa-calendar-plus text-emerald-500 mr-2"></i>
              Agendar Exame
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {dataPadrao ? `Agendamento para ${new Date(dataPadrao).toLocaleDateString('pt-BR')}` : 'Marque um exame para o paciente'}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl transition-colors">
            <i className="fas fa-times"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Paciente *
            </label>
            <select
              name="pacienteId"
              value={formData.pacienteId}
              onChange={handleChange}
              required
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
            >
              <option value="">Selecione o paciente</option>
              {pacientes.map((p) => (
                <option key={p.id} value={p.id}>{p.nome}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de Exame *
              </label>
              <select
                name="tipoExame"
                value={formData.tipoExame}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
              >
                <option value="">Selecione o exame</option>
                {tiposExame.map((tipo) => (
                  <option key={tipo} value={tipo}>{tipo}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Médico Responsável
              </label>
              <select
                name="medico"
                value={formData.medico}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
              >
                <option value="">Selecione o médico</option>
                {medicos.map((medico) => (
                  <option key={medico} value={medico}>{medico}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data *
              </label>
              <input
                type="date"
                name="data"
                value={formData.data}
                onChange={handleChange}
                required
                disabled={!!dataPadrao}
                className={`w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all ${
                  dataPadrao ? 'bg-gray-100 cursor-not-allowed' : ''
                }`}
              />
              {dataPadrao && (
                <p className="text-xs text-emerald-500 mt-1">
                  <i className="fas fa-info-circle mr-1"></i>
                  Data definida pelo calendário
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Horário *
              </label>
              <input
                type="time"
                name="horario"
                value={formData.horario}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Observações
            </label>
            <textarea
              name="observacoes"
              value={formData.observacoes}
              onChange={handleChange}
              rows="3"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all resize-none"
              placeholder="Informações adicionais sobre o exame..."
            />
          </div>

          <button
            type="submit"
            className="w-full gradient-bg text-white py-3 rounded-xl font-bold hover:scale-[1.02] transition-all shadow-lg shadow-emerald-500/30"
          >
            <i className="fas fa-check mr-2"></i>
            Confirmar Agendamento
          </button>
        </form>
      </div>
    </div>
  );
};

// ==================== MODAL DE PRONTUÁRIO ====================
const ProntuarioModal = ({ paciente, onClose }) => {
  const [historico, setHistorico] = useState(paciente.historico || []);
  const [novaDescricao, setNovaDescricao] = useState('');
  const [tipoAtendimento, setTipoAtendimento] = useState('Consulta');

  const adicionarAtendimento = async () => {
  if (novaDescricao.trim()) {
    const novo = {
      id: gerarId(),
      data: new Date().toISOString().split('T')[0],
      tipo: tipoAtendimento,
      descricao: novaDescricao,
      criadoEm: new Date().toISOString()
    };

    const updated = [novo, ...historico];

    const { error } = await supabase
      .from('pacientes')
      .update({
        historico: updated
      })
      .eq('id', paciente.id);

    if (error) {
      console.error('Erro ao salvar atendimento:', error);
      alert('Não foi possível salvar o atendimento.');
      return;
    }

    setHistorico(updated);

    setNovaDescricao('');
  }
};

  const tiposAtendimento = ['Consulta', 'Exame', 'Retorno', 'Emergência', 'Cirurgia', 'Outro'];

  return (
    <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-8 shadow-2xl animate-fade-in">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              <i className="fas fa-notes-medical text-emerald-500 mr-2"></i>
              Prontuário de {paciente.nome}
            </h2>
            <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-500">
              <span><i className="fas fa-envelope mr-1"></i>{paciente.email}</span>
              <span><i className="fas fa-phone mr-1"></i>{paciente.telefone}</span>
              {paciente.convenio && (
                <span><i className="fas fa-id-card mr-1"></i>{paciente.convenio}</span>
              )}
              {paciente.alergias && (
                <span className="text-red-500"><i className="fas fa-exclamation-triangle mr-1"></i>Alergias: {paciente.alergias}</span>
              )}
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl transition-colors">
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-emerald-50 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-emerald-600">{historico.length}</p>
            <p className="text-sm text-gray-600">Atendimentos</p>
          </div>
          <div className="bg-blue-50 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">
              {historico.filter(h => h.tipo === 'Exame').length}
            </p>
            <p className="text-sm text-gray-600">Exames</p>
          </div>
          <div className="bg-purple-50 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-purple-600">
              {historico.filter(h => h.tipo === 'Consulta').length}
            </p>
            <p className="text-sm text-gray-600">Consultas</p>
          </div>
          <div className="bg-pink-50 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-pink-600">
              {paciente.dataNascimento ? (new Date().getFullYear() - new Date(paciente.dataNascimento).getFullYear()) : '-'}
            </p>
            <p className="text-sm text-gray-600">Idade</p>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="font-bold text-gray-800 mb-3">
            <i className="fas fa-plus-circle text-emerald-500 mr-2"></i>
            Adicionar Atendimento
          </h3>
          <div className="flex flex-wrap gap-3">
            <select
              value={tipoAtendimento}
              onChange={(e) => setTipoAtendimento(e.target.value)}
              className="px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
            >
              {tiposAtendimento.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <input
              type="text"
              value={novaDescricao}
              onChange={(e) => setNovaDescricao(e.target.value)}
              placeholder="Descreva o atendimento..."
              className="flex-1 min-w-[200px] px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
              onKeyDown={(e) => e.key === 'Enter' && adicionarAtendimento()}
            />
            <button
              onClick={adicionarAtendimento}
              className="gradient-bg text-white px-6 py-2.5 rounded-xl font-semibold hover:scale-[1.02] transition-all shadow-lg shadow-emerald-500/30"
            >
              <i className="fas fa-plus mr-2"></i>
              Adicionar
            </button>
          </div>
        </div>

        <h3 className="font-bold text-gray-800 mb-4">
          <i className="fas fa-history text-emerald-500 mr-2"></i>
          Histórico de Atendimentos
        </h3>

        <div className="space-y-3 max-h-96 overflow-y-auto">
          {historico.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <i className="fas fa-clock text-4xl text-gray-300 mb-3 block"></i>
              Nenhum atendimento registrado
            </div>
          ) : (
            historico.map((item) => (
              <div key={item.id} className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                  item.tipo === 'Consulta' ? 'bg-blue-100 text-blue-600' :
                  item.tipo === 'Exame' ? 'bg-purple-100 text-purple-600' :
                  item.tipo === 'Retorno' ? 'bg-emerald-100 text-emerald-600' :
                  item.tipo === 'Emergência' ? 'bg-red-100 text-red-600' :
                  item.tipo === 'Cirurgia' ? 'bg-pink-100 text-pink-600' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  <i className={`fas fa-${
                    item.tipo === 'Consulta' ? 'stethoscope' :
                    item.tipo === 'Exame' ? 'flask' :
                    item.tipo === 'Retorno' ? 'undo' :
                    item.tipo === 'Emergência' ? 'ambulance' :
                    item.tipo === 'Cirurgia' ? 'scalpel' :
                    'notes-medical'
                  }`}></i>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-gray-800">{item.tipo}</p>
                      <p className="text-sm text-gray-600">{item.descricao}</p>
                    </div>
                    <span className="text-xs text-gray-400">
                      {new Date(item.data).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};


// ==================== MODAL DE WHATSAPP ====================
const MensagensModal = ({ onClose }) => {
  const [pacienteSelecionado, setPacienteSelecionado] = useState('');
  const [novaMensagem, setNovaMensagem] = useState('');

  const [pacientes, setPacientes] = useState([]);

  useEffect(() => {
    const carregarPacientes = async () => {
      const { data, error } = await supabase
        .from('pacientes')
        .select('*')
        .order('nome', { ascending: true });

      if (error) {
        console.error('Erro ao carregar pacientes:', error);
        return;
      }

      setPacientes(data || []);
    };

    carregarPacientes();
  }, []);

  const enviarWhatsApp = () => {
    if (!pacienteSelecionado) {
      alert('Selecione um paciente.');
      return;
    }

    if (!novaMensagem.trim()) {
      alert('Digite uma mensagem.');
      return;
    }

    const paciente = pacientes.find(
      p => p.id === Number(pacienteSelecionado)
    );

    if (!paciente) {
      alert('Paciente não encontrado.');
      return;
    }

    if (!paciente.telefone) {
      alert('Este paciente não possui telefone cadastrado.');
      return;
    }

    // Remove tudo que não for número
    let telefone = paciente.telefone.replace(/\D/g, '');

    // Adiciona o código do Brasil caso não exista
    if (!telefone.startsWith('55')) {
      telefone = '55' + telefone;
    }

    const mensagem = encodeURIComponent(novaMensagem.trim());

    const url = `https://wa.me/${telefone}?text=${mensagem}`;

    window.open(url, '_blank');

    setNovaMensagem('');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">

        {/* Cabeçalho */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-800">
              <i className="fab fa-whatsapp text-green-500 mr-2"></i>
              WhatsApp
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              Envie uma mensagem para o paciente pelo WhatsApp
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl transition-colors"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Conteúdo */}
        <div className="p-6">

          {/* Paciente */}
          <div className="mb-5">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Paciente
            </label>

            <select
              value={pacienteSelecionado}
              onChange={(e) => setPacienteSelecionado(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
            >
              <option value="">
                Selecione o paciente
              </option>

              {pacientes.map((paciente) => (
                <option
                  key={paciente.id}
                  value={paciente.id}
                >
                  {paciente.nome}
                  {paciente.telefone
                    ? ` - ${paciente.telefone}`
                    : ' - Sem telefone'}
                </option>
              ))}
            </select>
          </div>

          {/* Mensagem */}
          <div className="mb-5">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Mensagem
            </label>

            <textarea
              value={novaMensagem}
              onChange={(e) => setNovaMensagem(e.target.value)}
              placeholder="Digite a mensagem que deseja enviar..."
              rows="5"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none resize-none"
            />
          </div>

          {/* Botão */}
          <button
            onClick={enviarWhatsApp}
            className="w-full bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-lg flex items-center justify-center gap-2"
          >
            <i className="fab fa-whatsapp text-xl"></i>
            Abrir WhatsApp
          </button>

          <p className="text-xs text-gray-400 text-center mt-3">
            O WhatsApp será aberto com a mensagem preenchida.
          </p>

        </div>
      </div>
    </div>
  );
};

// ==================== MODAL DE RELATÓRIOS ====================
const RelatoriosModal = ({ onClose, pacientes, agendamentos, documentos }) => {
  const gerarRelatorioPDF = () => {
    alert('📄 Relatório gerado com sucesso! (PDF - Simulação)');
  };

  const exportarExcel = () => {
    alert('📊 Dados exportados para Excel! (Simulação)');
  };

  const totalPacientes = pacientes.length;
  const totalAgendamentos = agendamentos.length;
  const totalDocumentos = documentos.length;
  const realizados = agendamentos.filter(a => a.status === 'Realizado').length;
  const pendentes = agendamentos.filter(a => a.status === 'Pendente').length;

  return (
    <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-8 shadow-2xl animate-fade-in">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              <i className="fas fa-chart-bar text-emerald-500 mr-2"></i>
              Relatórios e Estatísticas
            </h2>
            <p className="text-sm text-gray-500 mt-1">Visão geral do hospital</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl transition-colors">
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-emerald-50 rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-emerald-600">{totalPacientes}</p>
            <p className="text-sm text-gray-600">Total de Pacientes</p>
          </div>
          <div className="bg-blue-50 rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-blue-600">{totalAgendamentos}</p>
            <p className="text-sm text-gray-600">Agendamentos</p>
          </div>
          <div className="bg-purple-50 rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-purple-600">{totalDocumentos}</p>
            <p className="text-sm text-gray-600">Documentos</p>
          </div>
          <div className="bg-yellow-50 rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-yellow-600">{pendentes}</p>
            <p className="text-sm text-gray-600">Pendentes</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-50 rounded-xl p-4">
            <h4 className="font-semibold text-gray-700 mb-2">Status dos Agendamentos</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Realizados</span>
                <span className="text-sm font-bold text-emerald-600">{realizados}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Confirmados</span>
                <span className="text-sm font-bold text-blue-600">
                  {agendamentos.filter(a => a.status === 'Confirmado').length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Pendentes</span>
                <span className="text-sm font-bold text-yellow-600">{pendentes}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Cancelados</span>
                <span className="text-sm font-bold text-red-600">
                  {agendamentos.filter(a => a.status === 'Cancelado').length}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4">
            <h4 className="font-semibold text-gray-700 mb-2">Convênios</h4>
            <div className="space-y-1">
              {Object.entries(
                pacientes.reduce((acc, p) => {
                  const conv = p.convenio || 'Particular';
                  acc[conv] = (acc[conv] || 0) + 1;
                  return acc;
                }, {})
              ).slice(0, 5).map(([key, value]) => (
                <div key={key} className="flex justify-between">
                  <span className="text-sm text-gray-600">{key}</span>
                  <span className="text-sm font-bold text-gray-800">{value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4">
            <h4 className="font-semibold text-gray-700 mb-2">Exames Mais Comuns</h4>
            <div className="space-y-1">
              {Object.entries(
                agendamentos.reduce((acc, a) => {
                  acc[a.tipoExame] = (acc[a.tipoExame] || 0) + 1;
                  return acc;
                }, {})
              ).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([key, value]) => (
                <div key={key} className="flex justify-between">
                  <span className="text-sm text-gray-600">{key}</span>
                  <span className="text-sm font-bold text-gray-800">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-4">
          <button
            onClick={gerarRelatorioPDF}
            className="flex-1 gradient-bg text-white py-3 rounded-xl font-bold hover:scale-[1.02] transition-all shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2"
          >
            <i className="fas fa-file-pdf"></i>
            Gerar Relatório PDF
          </button>
          <button
            onClick={exportarExcel}
            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-xl font-bold hover:scale-[1.02] transition-all shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2"
          >
            <i className="fas fa-file-excel"></i>
            Exportar Excel
          </button>
          <button
            onClick={() => {
              alert('📋 Relatório impresso! (Simulação)');
            }}
            className="flex-1 bg-purple-500 hover:bg-purple-600 text-white py-3 rounded-xl font-bold hover:scale-[1.02] transition-all shadow-lg shadow-purple-500/30 flex items-center justify-center gap-2"
          >
            <i className="fas fa-print"></i>
            Imprimir
          </button>
        </div>
      </div>
    </div>
  );
};

// ==================== CALENDÁRIO (CORRIGIDO) ====================
const Calendario = ({ agendamentos, onAgendarClick }) => {
  const [mesAtual, setMesAtual] = useState(new Date());

  const diasDaSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  const getDiasMes = (ano, mes) => {
    const firstDay = new Date(ano, mes, 1).getDay();
    const daysInMonth = new Date(ano, mes + 1, 0).getDate();
    const days = [];
    
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    
    return days;
  };

  const temEvento = (dia) => {
    if (!dia) return false;
    const data = new Date(mesAtual.getFullYear(), mesAtual.getMonth(), dia);
    const dataStr = data.toISOString().split('T')[0];
    return agendamentos.some(e => e.data === dataStr);
  };

  const getEventosDoDia = (dia) => {
    if (!dia) return [];
    const data = new Date(mesAtual.getFullYear(), mesAtual.getMonth(), dia);
    const dataStr = data.toISOString().split('T')[0];
    return agendamentos.filter(e => e.data === dataStr);
  };

  const mudarMes = (delta) => {
    setMesAtual(new Date(mesAtual.getFullYear(), mesAtual.getMonth() + delta, 1));
  };

  const hoje = new Date();

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-gray-800">
          <i className="fas fa-calendar-alt text-emerald-500 mr-2"></i>
          Calendário de Agendamentos
        </h3>
        <div className="flex gap-2">
          <button
            onClick={() => mudarMes(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <i className="fas fa-chevron-left"></i>
          </button>
          <span className="text-sm font-semibold text-gray-700 px-4 py-2">
            {mesAtual.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}
          </span>
          <button
            onClick={() => mudarMes(1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <i className="fas fa-chevron-right"></i>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {diasDaSemana.map((dia, i) => (
          <div key={i} className="text-center text-sm font-semibold text-gray-500 py-2">
            {dia}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {getDiasMes(mesAtual.getFullYear(), mesAtual.getMonth()).map((dia, index) => {
          const isToday = dia && 
            hoje.getDate() === dia && 
            hoje.getMonth() === mesAtual.getMonth() && 
            hoje.getFullYear() === mesAtual.getFullYear();
          const hasEvent = temEvento(dia);
          const eventosDia = getEventosDoDia(dia);

          return (
            <div
              key={index}
              className={`calendar-day rounded-xl flex flex-col items-center justify-center cursor-pointer ${
                dia ? 'bg-white hover:bg-emerald-50' : 'bg-transparent'
              } ${isToday ? 'today' : ''} ${hasEvent ? 'has-event' : ''}`}
              onClick={() => {
                if (dia && eventosDia.length > 0) {
                  const dataStr = new Date(mesAtual.getFullYear(), mesAtual.getMonth(), dia).toISOString().split('T')[0];
                  alert(`📅 Agendamentos para ${new Date(dataStr).toLocaleDateString('pt-BR')}:\n${eventosDia.map(e => `- ${e.tipoExame} - ${e.pacienteNome} (${e.horario})`).join('\n')}`);
                } else if (dia) {
                  const dataSelecionada = new Date(mesAtual.getFullYear(), mesAtual.getMonth(), dia);
                  const dataStr = dataSelecionada.toISOString().split('T')[0];
                  onAgendarClick(dataStr);
                }
              }}
              title={dia ? `${dia}/${mesAtual.getMonth()+1}/${mesAtual.getFullYear()}` : ''}
            >
              {dia && (
                <>
                  <span className={`text-sm font-medium ${hasEvent ? 'text-white' : 'text-gray-700'}`}>
                    {dia}
                  </span>
                  {hasEvent && (
                    <span className="event-count">
                      {eventosDia.length}
                    </span>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap gap-3 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded border-2 border-emerald-500 bg-white"></div>
          <span className="text-gray-600">Hoje</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded gradient-bg"></div>
          <span className="text-gray-600">Com agendamento</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-white border border-gray-300"></div>
          <span className="text-gray-600">Disponível</span>
        </div>
      </div>
    </div>
  );
};

// ==================== PAINEL PRINCIPAL ====================
const App = () => {
    
  const [usuario, setUsuario] = useState(null);
  const [pacientes, setPacientes] = useState([]);
  const [agendamentos, setAgendamentos] = useState([]);
  const [documentos, setDocumentos] = useState([]);
  const [selectedPaciente, setSelectedPaciente] = useState(null);
  const [showCadastro, setShowCadastro] = useState(false);
  const [showAgendamento, setShowAgendamento] = useState(false);
  const [showDocumentos, setShowDocumentos] = useState(false);
  const [showProntuario, setShowProntuario] = useState(false);
  const [showMensagens, setShowMensagens] = useState(false);
  const [showRelatorios, setShowRelatorios] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('success');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobile, setIsMobile] = useState(false);
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [filtroData, setFiltroData] = useState('');
  const [dataAgendamento, setDataAgendamento] = useState('');
  
  
const testarSupabaseUsuarios = async () => {
  const { data, error } = await supabase
    .from('usuarios')
    .select('*');

  console.log('Dados do Supabase:', data);
  console.log('Erro do Supabase:', error);
};

const testarSupabasePacientes = async () => {
  const { data, error } = await supabase
    .from('pacientes')
    .select('*');

  console.log('Pacientes do Supabase:', data);
  console.log('Erro dos pacientes:', error);
};
  // Carregar dados do Supabase
useEffect(() => {

  const carregarPacientes = async () => {
    const { data, error } = await supabase
      .from('pacientes')
      .select('*');

    if (error) {
      console.error('Erro ao carregar pacientes:', error);
      return;
    }

    setPacientes(data);
  };

  carregarPacientes();
 const carregarAgendamentos = async () => {
  const { data, error } = await supabase
    .from('agendamentos')
    .select('*');

  if (error) {
    console.error('Erro ao carregar agendamentos:', error);
    return;
  }

  const agendamentosFormatados = data.map(a => ({
    ...a,
    pacienteId: a.paciente_id,
    pacienteNome: a.paciente_nome,
    tipoExame: a.tipo_exame,
    criadoEm: a.criado_em
  }));

  setAgendamentos(agendamentosFormatados);
};

carregarAgendamentos();

  
  const carregarDocumentos = async () => {
  const { data, error } = await supabase
    .from('documentos')
    .select('*');

  if (error) {
    console.error('Erro ao carregar documentos:', error);
    return;
  }

  const documentosFormatados = data.map(d => ({
    ...d,
    pacienteId: d.paciente_id,
    pacienteNome: d.paciente_nome
  }));

  setDocumentos(documentosFormatados);
};

carregarDocumentos();

}, []);

  const showNotification = (message, type = 'success') => {
    setAlertMessage(message);
    setAlertType(type);
    setShowAlert(true);
    setTimeout(() => setShowAlert(false), 3000);
  };

  // Funções de Pacientes
  const handleCadastrarPaciente = async (dados) => {
  const { data, error } = await supabase
    .from('pacientes')
    .insert([
      {
        nome: dados.nome,
        email: dados.email,
        telefone: dados.telefone,
        data_nascimento: dados.dataNascimento,
        endereco: dados.endereco,
        cidade: dados.cidade,
        estado: dados.estado,
        cep: dados.cep,
        convenio: dados.convenio,
        alergias: dados.alergias,
        medicacoes: dados.medicacoes,
        observacoes: dados.observacoes,
        historico: dados.historico || []
      }
    ])
    .select()
    .single();

  if (error) {
    console.error('Erro ao cadastrar paciente:', error);
    showNotification('❌ Não foi possível cadastrar o paciente', 'error');
    return;
  }

  setPacientes([data, ...pacientes]);

  showNotification(`✅ Paciente ${data.nome} cadastrado com sucesso!`);
};
  const handleExcluirPaciente = async (id) => {
  if (confirm('Tem certeza que deseja excluir este paciente?')) {

    const { error } = await supabase
      .from('pacientes')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao excluir paciente:', error);
      showNotification('❌ Não foi possível excluir o paciente', 'error');
      return;
    }

    const updated = pacientes.filter(p => p.id !== id);

    setPacientes(updated);

    const agendamentosAtualizados = agendamentos.filter(
      a => a.pacienteId !== id
    );

    setAgendamentos(agendamentosAtualizados);

    showNotification('🗑️ Paciente excluído');
  }
};

  // Funções de Agendamentos - CORRIGIDO
 const handleAgendarExame = async (dados) => {
  const pacienteId = Number(dados.pacienteId);
  const paciente = pacientes.find(p => p.id === pacienteId);

  const { data, error } = await supabase
    .from('agendamentos')
    .insert([
      {
        paciente_id: pacienteId,
        paciente_nome: paciente
          ? paciente.nome
          : dados.pacienteNome || 'Paciente não encontrado',
        tipo_exame: dados.tipoExame,
        data: dados.data,
        horario: dados.horario,
        status: 'Pendente',
        medico: dados.medico,
        observacoes: dados.observacoes
      }
    ])
    .select()
    .single();

  if (error) {
    console.error('Erro ao agendar exame:', error);
    showNotification('❌ Não foi possível agendar o exame', 'error');
    return;
  }

  const agendamentoFormatado = {
    ...data,
    pacienteId: data.paciente_id,
    pacienteNome: data.paciente_nome,
    tipoExame: data.tipo_exame,
    criadoEm: data.criado_em
  };

  setAgendamentos([agendamentoFormatado, ...agendamentos]);

  showNotification(`✅ Exame agendado para ${agendamentoFormatado.pacienteNome}`);
};

  const handleStatusChange = async (id, novoStatus) => {
  const { error } = await supabase
    .from('agendamentos')
    .update({
      status: novoStatus
    })
    .eq('id', id);

  if (error) {
    console.error('Erro ao atualizar status:', error);
    showNotification('❌ Não foi possível atualizar o status', 'error');
    return;
  }

  const updated = agendamentos.map(a =>
    a.id === id
      ? { ...a, status: novoStatus }
      : a
  );

  setAgendamentos(updated);

  showNotification(`✅ Status atualizado para "${novoStatus}"`);
};

  const handleExcluirAgendamento = async (id) => {
  if (confirm('Tem certeza que deseja excluir este agendamento?')) {

    const { error } = await supabase
      .from('agendamentos')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao excluir agendamento:', error);
      showNotification('❌ Não foi possível excluir o agendamento', 'error');
      return;
    }

    const updated = agendamentos.filter(a => a.id !== id);

    setAgendamentos(updated);

    showNotification('🗑️ Agendamento excluído');
  }
};

  // Funções de Documentos
  const handleAddDocumento = async (doc) => {
  const pacienteId = Number(doc.pacienteId);
  const paciente = pacientes.find(p => p.id === pacienteId);

  const { data, error } = await supabase
    .from('documentos')
    .insert([
      {
        paciente_id: pacienteId,
        paciente_nome: paciente
          ? paciente.nome
          : doc.pacienteNome || 'Paciente não encontrado',
        imagem: doc.imagem,
        data: doc.data,
        descricao: doc.descricao
      }
    ])
    .select()
    .single();

  if (error) {
    console.error('Erro ao adicionar documento:', error);
    showNotification('❌ Não foi possível adicionar o documento', 'error');
    return;
  }

  const documentoFormatado = {
    ...data,
    pacienteId: data.paciente_id,
    pacienteNome: data.paciente_nome
  };

  setDocumentos([documentoFormatado, ...documentos]);

  showNotification('📸 Documento adicionado com sucesso!');
};
  const handleExcluirDocumento = async (pacienteId, index) => {
  const docsPaciente = documentos.filter(d => d.pacienteId === pacienteId);
  const docToRemove = docsPaciente[index];

  if (!docToRemove) {
    return;
  }

  if (confirm('Tem certeza que deseja excluir este documento?')) {

    const { error } = await supabase
      .from('documentos')
      .delete()
      .eq('id', docToRemove.id);

    if (error) {
      console.error('Erro ao excluir documento:', error);
      showNotification('❌ Não foi possível excluir o documento', 'error');
      return;
    }

    const updated = documentos.filter(d => d.id !== docToRemove.id);

    setDocumentos(updated);

    showNotification('🗑️ Documento excluído');
  }
};

 const handleExplicarDocumento = async (pacienteId, index, descricao) => {
  const docsPaciente = documentos.filter(d => d.pacienteId === pacienteId);
  const docToUpdate = docsPaciente[index];

  if (!docToUpdate) {
    return;
  }

  const { error } = await supabase
    .from('documentos')
    .update({
      descricao: descricao
    })
    .eq('id', docToUpdate.id);

  if (error) {
    console.error('Erro ao atualizar descrição:', error);
    showNotification('❌ Não foi possível atualizar a descrição', 'error');
    return;
  }

  const updated = documentos.map(d =>
    d.id === docToUpdate.id
      ? { ...d, descricao: descricao }
      : d
  );

  setDocumentos(updated);

  showNotification('📝 Descrição adicionada!');
};

  // Filtros
  const pacientesFiltrados = pacientes.filter(p =>
    p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.convenio && p.convenio.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const agendamentosFiltrados = agendamentos.filter(a => {
    const matchSearch = a.pacienteNome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.tipoExame.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filtroStatus === 'todos' || a.status === filtroStatus;
    const matchData = !filtroData || a.data === filtroData;
    return matchSearch && matchStatus && matchData;
  });
   
  // Estatísticas
  const totalPacientes = pacientes.length;
  const totalAgendamentos = agendamentos.length;
  const pendentes = agendamentos.filter(a => a.status === 'Pendente').length;
  const confirmados = agendamentos.filter(a => a.status === 'Confirmado').length;
  const realizados = agendamentos.filter(a => a.status === 'Realizado').length;
  const totalDocumentos = documentos.length;

  // Função para abrir agendamento com data
  const handleAbrirAgendamento = (data = '') => {
    setDataAgendamento(data || '');
    setShowAgendamento(true);
  };

  // Verificar se está logado
  if (!usuario) {
    return <Login onLogin={setUsuario} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
        
      {showCadastro && (
        <CadastroPacienteModal 
          onClose={() => setShowCadastro(false)}
          onCadastrar={handleCadastrarPaciente}
        />
      )}
      
      {showAgendamento && (
        <AgendamentoModal 
          onClose={() => setShowAgendamento(false)}
          onAgendar={handleAgendarExame}
          pacientes={pacientes}
          dataPadrao={dataAgendamento}
        />
      )}
      
      {showProntuario && selectedPaciente && (
        <ProntuarioModal 
          paciente={selectedPaciente}
          onClose={() => {
            setShowProntuario(false);
            setSelectedPaciente(null);
          }}
        />
      )}

      {showMensagens && (
        <MensagensModal onClose={() => setShowMensagens(false)} />
      )}

      {showRelatorios && (
        <RelatoriosModal 
          onClose={() => setShowRelatorios(false)}
          pacientes={pacientes}
          agendamentos={agendamentos}
          documentos={documentos}
        />
      )}

      {showDocumentos && selectedPaciente && (
        <DocumentosPacienteModal 
          paciente={selectedPaciente}
          documentos={documentos}
          onClose={() => {
            setShowDocumentos(false);
            setSelectedPaciente(null);
          }}
          onExcluir={handleExcluirDocumento}
          onExplicar={handleExplicarDocumento}
          onAddDocumento={handleAddDocumento}
        />
      )}

      {showAlert && (
        <div className={`fixed top-4 right-4 z-[9998] bg-white rounded-2xl shadow-2xl px-6 py-4 border-l-4 ${
          alertType === 'success' ? 'border-emerald-500' : 'border-red-500'
        } max-w-md w-full mx-4 animate-fade-in`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full ${
              alertType === 'success' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
            } flex items-center justify-center flex-shrink-0`}>
              <i className={`fas fa-${alertType === 'success' ? 'check' : 'exclamation'}`}></i>
            </div>
            <p className="text-gray-800 font-medium flex-1">{alertMessage}</p>
            <button onClick={() => setShowAlert(false)} className="text-gray-400 hover:text-gray-600">
              <i className="fas fa-times"></i>
            </button>
          </div>
        </div>
      )}

      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isMobile={isMobile} 
        setIsMobile={setIsMobile}
        onLogout={() => setUsuario(null)}
      />

      {/* Header Mobile */}
      <header className="md:hidden bg-white shadow-sm sticky top-0 z-40">
        <div className="flex items-center justify-between px-4 h-16">
          <button onClick={() => setIsMobile(true)} className="text-gray-600 text-2xl">
            <i className="fas fa-bars"></i>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full gradient-bg flex items-center justify-center">
              <i className="fas fa-heartbeat text-white text-sm"></i>
            </div>
            <span className="font-bold text-gray-800">São Dridri</span>
          </div>
          <button 
            onClick={() => setShowMensagens(true)}
            className="text-gray-600 text-xl"
          >
            <i className="fas fa-comments"></i>
          </button>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <div className="md:ml-64 p-4 md:p-8">
        {/* Top Bar */}
        <div className="hidden md:flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              {activeTab === 'dashboard' && 'Dashboard'}
              {activeTab === 'pacientes' && 'Pacientes'}
              {activeTab === 'agendamentos' && 'Agendamentos'}
              {activeTab === 'calendario' && 'Calendário'}
              {activeTab === 'documentos' && 'Documentos'}
              {activeTab === 'atendimentos' && 'Atendimentos'}
              {activeTab === 'mensagens' && 'Mensagens'}
              {activeTab === 'relatorios' && 'Relatórios'}
              {activeTab === 'configuracoes' && 'Configurações'}
            </h2>
            <p className="text-sm text-gray-500">Bem-vindo ao painel administrativo</p>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setShowMensagens(true)}
              className="text-gray-500 hover:text-gray-700 text-xl transition-colors"
            >
              <i className="fas fa-comments"></i>
            </button>
            <button 
              onClick={() => handleAbrirAgendamento()}
              className="gradient-bg text-white px-4 py-2 rounded-xl font-semibold hover:scale-[1.02] transition-all shadow-lg shadow-emerald-500/30 flex items-center gap-2"
            >
              <i className="fas fa-calendar-plus"></i>
              Novo Agendamento
            </button>
            <button 
              onClick={() => setShowCadastro(true)}
              className="gradient-bg text-white px-4 py-2 rounded-xl font-semibold hover:scale-[1.02] transition-all shadow-lg shadow-emerald-500/30 flex items-center gap-2"
            >
              <i className="fas fa-user-plus"></i>
              Novo Paciente
            </button>
          </div>
        </div>

        {/* Dashboard */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <StatsCard icon="fa-users" label="Pacientes" value={totalPacientes} color="emerald" />
              <StatsCard icon="fa-calendar-check" label="Agendamentos" value={totalAgendamentos} color="blue" />
              <StatsCard icon="fa-clock" label="Pendentes" value={pendentes} color="yellow" />
              <StatsCard icon="fa-check-circle" label="Confirmados" value={confirmados} color="purple" />
              <StatsCard icon="fa-check-double" label="Realizados" value={realizados} color="emerald" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-white rounded-2xl p-6 shadow-sm col-span-2">
                <h3 className="font-bold text-gray-800 mb-4">
                  <i className="fas fa-chart-bar text-emerald-500 mr-2"></i>
                  Atendimentos da Semana
                </h3>
                <div className="flex items-end gap-3 h-48">
                  {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map((dia, i) => {
                    const altura = Math.floor(Math.random() * 80) + 20;
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-2">
                        <div 
                          className="w-full gradient-bg rounded-t-lg transition-all hover:scale-105"
                          style={{ height: `${altura}px` }}
                        ></div>
                        <span className="text-xs text-gray-500">{dia}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h3 className="font-bold text-gray-800 mb-4">
                  <i className="fas fa-bullseye text-emerald-500 mr-2"></i>
                  Resumo Rápido
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                    <span className="text-sm text-gray-600">Documentos</span>
                    <span className="text-sm font-bold text-emerald-600">{totalDocumentos}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                    <span className="text-sm text-gray-600">Convênios</span>
                    <span className="text-sm font-bold text-emerald-600">
                      {new Set(pacientes.map(p => p.convenio || 'Particular')).size}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                    <span className="text-sm text-gray-600">Médicos</span>
                    <span className="text-sm font-bold text-emerald-600">
                      {new Set(agendamentos.map(a => a.medico).filter(Boolean)).size || 5}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Pacientes */}
        {activeTab === 'pacientes' && (
          <div className="animate-fade-in">
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <div className="flex flex-wrap gap-4 items-center justify-between">
                  <div className="relative flex-1 max-w-md">
                    <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                    <input
                      type="text"
                      placeholder="Buscar paciente por nome, email ou convênio..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                    />
                  </div>
                  <button 
                    onClick={() => setShowCadastro(true)}
                    className="gradient-bg text-white px-4 py-2 rounded-xl font-semibold hover:scale-[1.02] transition-all shadow-lg shadow-emerald-500/30 flex items-center gap-2"
                  >
                    <i className="fas fa-plus"></i>
                    Novo Paciente
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left py-3 px-6 text-sm font-semibold text-gray-600">Paciente</th>
                      <th className="text-left py-3 px-6 text-sm font-semibold text-gray-600">Contato</th>
                      <th className="text-left py-3 px-6 text-sm font-semibold text-gray-600">Convênio</th>
                      <th className="text-left py-3 px-6 text-sm font-semibold text-gray-600">Alergias</th>
                      <th className="text-left py-3 px-6 text-sm font-semibold text-gray-600">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pacientesFiltrados.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="text-center py-12 text-gray-500">
                          <i className="fas fa-users text-4xl text-gray-300 mb-3 block"></i>
                          Nenhum paciente encontrado
                        </td>
                      </tr>
                    ) : (
                      pacientesFiltrados.map((paciente) => (
                        <tr key={paciente.id} className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
                          <td className="py-3 px-6">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full gradient-bg flex items-center justify-center text-white font-bold text-sm">
                                {paciente.nome.charAt(0)}
                              </div>
                              <div>
                                <p className="font-medium text-gray-800">{paciente.nome}</p>
                                <p className="text-xs text-gray-500">{paciente.dataNascimento ? new Date(paciente.dataNascimento).toLocaleDateString('pt-BR') : '-'}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-6">
                            <p className="text-sm text-gray-600">{paciente.email}</p>
                            <p className="text-xs text-gray-500">{paciente.telefone}</p>
                          </td>
                          <td className="py-3 px-6">
                            <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-xs font-medium">
                              {paciente.convenio || 'Particular'}
                            </span>
                          </td>
                          <td className="py-3 px-6">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              paciente.alergias ? 'bg-red-50 text-red-600' : 'bg-gray-50 text-gray-400'
                            }`}>
                              {paciente.alergias || 'Nenhuma'}
                            </span>
                          </td>
                          <td className="py-3 px-6">
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  setSelectedPaciente(paciente);
                                  setShowProntuario(true);
                                }}
                                className="text-emerald-500 hover:text-emerald-700 transition-colors p-2 hover:bg-emerald-50 rounded-lg"
                                title="Prontuário"
                              >
                                <i className="fas fa-notes-medical"></i>
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedPaciente(paciente);
                                  setShowDocumentos(true);
                                }}
                                className="text-blue-500 hover:text-blue-700 transition-colors p-2 hover:bg-blue-50 rounded-lg"
                                title="Documentos"
                              >
                                <i className="fas fa-file-alt"></i>
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedPaciente(paciente);
                                  handleAbrirAgendamento();
                                }}
                                className="text-purple-500 hover:text-purple-700 transition-colors p-2 hover:bg-purple-50 rounded-lg"
                                title="Agendar"
                              >
                                <i className="fas fa-calendar-plus"></i>
                              </button>
                              <button
                                onClick={() => handleExcluirPaciente(paciente.id)}
                                className="text-red-500 hover:text-red-700 transition-colors p-2 hover:bg-red-50 rounded-lg"
                                title="Excluir"
                              >
                                <i className="fas fa-trash"></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Agendamentos */}
        {activeTab === 'agendamentos' && (
          <div className="animate-fade-in">
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <div className="flex flex-wrap gap-4 items-center justify-between">
                  <div className="relative flex-1 max-w-md">
                    <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                    <input
                      type="text"
                      placeholder="Buscar agendamento..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                    />
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <select
                      value={filtroStatus}
                      onChange={(e) => setFiltroStatus(e.target.value)}
                      className="px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                    >
                      <option value="todos">Todos os Status</option>
                      <option value="Pendente">Pendente</option>
                      <option value="Confirmado">Confirmado</option>
                      <option value="Realizado">Realizado</option>
                      <option value="Cancelado">Cancelado</option>
                    </select>
                    <input
                      type="date"
                      value={filtroData}
                      onChange={(e) => setFiltroData(e.target.value)}
                      className="px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                    />
                    <button 
                      onClick={() => handleAbrirAgendamento()}
                      className="gradient-bg text-white px-4 py-2 rounded-xl font-semibold hover:scale-[1.02] transition-all shadow-lg shadow-emerald-500/30 flex items-center gap-2"
                    >
                      <i className="fas fa-calendar-plus"></i>
                      Novo
                    </button>
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left py-3 px-6 text-sm font-semibold text-gray-600">Paciente</th>
                      <th className="text-left py-3 px-6 text-sm font-semibold text-gray-600">Exame</th>
                      <th className="text-left py-3 px-6 text-sm font-semibold text-gray-600">Data</th>
                      <th className="text-left py-3 px-6 text-sm font-semibold text-gray-600">Médico</th>
                      <th className="text-left py-3 px-6 text-sm font-semibold text-gray-600">Status</th>
                      <th className="text-left py-3 px-6 text-sm font-semibold text-gray-600">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {agendamentosFiltrados.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="text-center py-12 text-gray-500">
                          <i className="fas fa-calendar-times text-4xl text-gray-300 mb-3 block"></i>
                          Nenhum agendamento encontrado
                        </td>
                      </tr>
                    ) : (
                      agendamentosFiltrados.map((agend) => (
                        <tr key={agend.id} className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
                          <td className="py-3 px-6 font-medium text-gray-800">{agend.pacienteNome}</td>
                          <td className="py-3 px-6 text-sm text-gray-600">{agend.tipoExame}</td>
                          <td className="py-3 px-6 text-sm text-gray-600">
                            {new Date(agend.data).toLocaleDateString('pt-BR')}
                            <span className="block text-xs text-gray-400">{agend.horario}</span>
                          </td>
                          <td className="py-3 px-6 text-sm text-gray-600">{agend.medico || '-'}</td>
                          <td className="py-3 px-6">
                            <select
                              value={agend.status}
                              onChange={(e) => handleStatusChange(agend.id, e.target.value)}
                              className={`px-3 py-1.5 rounded-full text-xs font-semibold border-0 transition-all ${
                                agend.status === 'Pendente' ? 'bg-yellow-100 text-yellow-800' :
                                agend.status === 'Confirmado' ? 'bg-blue-100 text-blue-800' :
                                agend.status === 'Realizado' ? 'bg-emerald-100 text-emerald-800' :
                                'bg-red-100 text-red-800'
                              }`}
                            >
                              <option value="Pendente">Pendente</option>
                              <option value="Confirmado">Confirmado</option>
                              <option value="Realizado">Realizado</option>
                              <option value="Cancelado">Cancelado</option>
                            </select>
                          </td>
                          <td className="py-3 px-6">
                            <button
                              onClick={() => handleExcluirAgendamento(agend.id)}
                              className="text-red-500 hover:text-red-700 transition-colors p-2 hover:bg-red-50 rounded-lg"
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Calendário */}
        {activeTab === 'calendario' && (
          <div className="animate-fade-in">
            <Calendario 
              agendamentos={agendamentos} 
              onAgendarClick={handleAbrirAgendamento}
            />
          </div>
        )}

        {/* Documentos */}
        {activeTab === 'documentos' && (
          <div className="animate-fade-in">
            {documentos.length === 0 ? (
              <div className="bg-white rounded-2xl p-16 text-center shadow-sm">
                <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-file-image text-4xl text-gray-300"></i>
                </div>
                <h3 className="text-xl font-bold text-gray-800">Nenhum documento</h3>
                <p className="text-gray-500 mt-2">Capture documentos dos pacientes</p>
                <button
                  onClick={() => {
                    if (pacientes.length > 0) {
                      const p = pacientes[0];
                      setSelectedPaciente(p);
                      setShowDocumentos(true);
                    } else {
                      showNotification('⚠️ Cadastre um paciente primeiro', 'error');
                    }
                  }}
                  className="mt-4 gradient-bg text-white px-6 py-2 rounded-xl font-semibold hover:scale-[1.02] transition-all shadow-lg shadow-emerald-500/30"
                >
                  <i className="fas fa-camera mr-2"></i>
                  Adicionar Documento
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {documentos.map((doc) => (
                  <div key={doc.id} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all border border-gray-100 card-hover">
                    <img src={doc.imagem} alt="Documento" className="w-full h-56 object-cover" />
                    <div className="p-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-gray-800">{doc.pacienteNome}</p>
                          <p className="text-sm text-gray-500">
                            <i className="fas fa-calendar-alt mr-1"></i>
                            {new Date(doc.data).toLocaleDateString('pt-BR')}
                          </p>
                          {doc.descricao && (
                            <p className="text-sm text-gray-600 mt-2 bg-gray-50 p-2 rounded-lg">
                              <i className="fas fa-quote-left text-emerald-500 mr-1"></i>
                              {doc.descricao}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="mt-4 flex gap-2">
                        <button
                          onClick={() => {
                            const paciente = pacientes.find(p => p.id === doc.pacienteId);
                            if (paciente) {
                              setSelectedPaciente(paciente);
                              setShowDocumentos(true);
                            }
                          }}
                          className="flex-1 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors py-2 rounded-lg text-sm font-medium"
                        >
                          <i className="fas fa-eye mr-1"></i>
                          Ver Detalhes
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Atendimentos */}
        {activeTab === 'atendimentos' && (
          <div className="animate-fade-in">
            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full gradient-bg flex items-center justify-center">
                  <i className="fas fa-stethoscope text-white text-xl"></i>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">Atendimentos do Dia</h3>
                  <p className="text-sm text-gray-500">{new Date().toLocaleDateString('pt-BR')}</p>
                </div>
              </div>

              <div className="space-y-4">
                {agendamentos.filter(a => a.data === new Date().toISOString().split('T')[0]).length === 0 ? (
                  <div className="text-center py-12">
                    <i className="fas fa-clock text-4xl text-gray-300 mb-3 block"></i>
                    <p className="text-gray-500">Nenhum atendimento programado para hoje</p>
                  </div>
                ) : (
                  agendamentos.filter(a => a.data === new Date().toISOString().split('T')[0]).map((agend) => (
                    <div key={agend.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                      <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                        <i className="fas fa-user text-emerald-600"></i>
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800">{agend.pacienteNome}</p>
                        <p className="text-sm text-gray-500">{agend.tipoExame} - {agend.horario}</p>
                        {agend.medico && (
                          <p className="text-xs text-gray-400">Médico: {agend.medico}</p>
                        )}
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        agend.status === 'Realizado' ? 'bg-emerald-100 text-emerald-800' : 
                        agend.status === 'Confirmado' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {agend.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Mensagens */}
        {activeTab === 'mensagens' && (
          <div className="animate-fade-in">
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full gradient-bg flex items-center justify-center">
                  <i className="fas fa-comments text-white text-xl"></i>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">Central de Mensagens</h3>
                  <p className="text-sm text-gray-500">Comunique-se com os pacientes</p>
                </div>
              </div>
              <button
                onClick={() => setShowMensagens(true)}
                className="w-full gradient-bg text-white py-3 rounded-xl font-bold hover:scale-[1.02] transition-all shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2"
              >
                <i className="fas fa-arrow-right"></i>
                Abrir Central de Mensagens
              </button>
            </div>
          </div>
        )}

        {/* Relatórios */}
        {activeTab === 'relatorios' && (
          <div className="animate-fade-in">
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full gradient-bg flex items-center justify-center">
                  <i className="fas fa-chart-bar text-white text-xl"></i>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">Relatórios e Estatísticas</h3>
                  <p className="text-sm text-gray-500">Visualize dados do hospital</p>
                </div>
              </div>
              <button
                onClick={() => setShowRelatorios(true)}
                className="w-full gradient-bg text-white py-3 rounded-xl font-bold hover:scale-[1.02] transition-all shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2"
              >
                <i className="fas fa-arrow-right"></i>
                Abrir Relatórios
              </button>
            </div>
          </div>
        )}

        {/* Configurações */}
        {activeTab === 'configuracoes' && (
          <div className="animate-fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl p-8 shadow-sm">
                <h3 className="font-bold text-gray-800 mb-4">
                  <i className="fas fa-user-cog text-emerald-500 mr-2"></i>
                  Perfil do Administrador
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                    <input type="text" value={usuario?.nome || 'Administrador'} className="w-full px-4 py-2.5 border border-gray-300 rounded-xl bg-gray-50" disabled />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
                    <input type="email" value={usuario?.email || 'admin@saodridri.com'} className="w-full px-4 py-2.5 border border-gray-300 rounded-xl bg-gray-50" disabled />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cargo</label>
                    <input type="text" value="Administrador do Hospital" className="w-full px-4 py-2.5 border border-gray-300 rounded-xl bg-gray-50" disabled />
                  </div>
                  <button className="w-full gradient-bg text-white py-2.5 rounded-xl font-semibold hover:scale-[1.02] transition-all">
                    <i className="fas fa-edit mr-2"></i>
                    Editar Perfil
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-8 shadow-sm">
                <h3 className="font-bold text-gray-800 mb-4">
                  <i className="fas fa-cog text-emerald-500 mr-2"></i>
                  Configurações do Sistema
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div>
                      <p className="font-medium text-gray-800">Notificações</p>
                      <p className="text-sm text-gray-500">Receber alertas por e-mail</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div>
                      <p className="font-medium text-gray-800">Modo Escuro</p>
                      <p className="text-sm text-gray-500">Ativar tema escuro</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div>
                      <p className="font-medium text-gray-800">Backup Automático</p>
                      <p className="text-sm text-gray-500">Fazer backup dos dados</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="md:ml-64 bg-white border-t border-gray-200">
        <div className="container mx-auto px-4 md:px-8 py-4">
          <p className="text-center text-sm text-gray-500">
            © 2026 Hospital São Dridri - Todos os direitos reservados
          </p>
        </div>
      </footer>
    </div>
  );
};


// ==================== COMPONENTE DE DOCUMENTOS DO PACIENTE ====================
const DocumentosPacienteModal = ({ paciente, documentos, onClose, onExcluir, onExplicar, onAddDocumento }) => {
  const [explicando, setExplicando] = useState(null);
  const [showCamera, setShowCamera] = useState(false);

  const documentosPaciente = documentos.filter(d => d.pacienteId === paciente.id);

  const handlePhotoCapture = (imageData) => {
    onAddDocumento({
      id: gerarId(),
      pacienteId: paciente.id,
      pacienteNome: paciente.nome,
      imagem: imageData,
      data: new Date().toISOString(),
      descricao: ''
    });
    setShowCamera(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4">
      {showCamera && (
        <CameraComponent 
          onClose={() => setShowCamera(false)}
          onCapture={handlePhotoCapture}
        />
      )}
      
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-8 shadow-2xl animate-fade-in">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              <i className="fas fa-file-alt text-emerald-500 mr-2"></i>
              Documentos de {paciente.nome}
            </h2>
            <p className="text-sm text-gray-500">
              {documentosPaciente.length} {documentosPaciente.length === 1 ? 'documento' : 'documentos'}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowCamera(true)}
              className="gradient-bg text-white px-4 py-2 rounded-xl font-semibold hover:scale-[1.02] transition-all shadow-lg shadow-emerald-500/30 flex items-center gap-2"
            >
              <i className="fas fa-camera"></i>
              Adicionar
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl transition-colors">
              <i className="fas fa-times"></i>
            </button>
          </div>
        </div>

        {documentosPaciente.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-file-image text-4xl text-gray-300"></i>
            </div>
            <h3 className="text-xl font-bold text-gray-800">Nenhum documento</h3>
            <p className="text-gray-500 mt-2">Este paciente ainda não possui documentos cadastrados.</p>
            <button
              onClick={() => setShowCamera(true)}
              className="mt-4 gradient-bg text-white px-6 py-2 rounded-xl font-semibold hover:scale-[1.02] transition-all shadow-lg shadow-emerald-500/30"
            >
              <i className="fas fa-camera mr-2"></i>
              Adicionar Documento
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {documentosPaciente.map((doc, index) => (
              <div key={index} className="border border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg transition-all card-hover">
                <img 
                  src={doc.imagem} 
                  alt={`Documento ${index + 1}`} 
                  className="w-full h-52 object-cover"
                />
                <div className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm text-gray-500">
                        <i className="fas fa-calendar-alt mr-1"></i>
                        {new Date(doc.data).toLocaleDateString('pt-BR')}
                      </p>
                      {doc.descricao && (
                        <p className="text-sm text-gray-700 mt-2 bg-gray-50 p-2 rounded-lg">
                          <i className="fas fa-quote-left text-emerald-500 mr-1"></i>
                          {doc.descricao}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {!doc.descricao && (
                        <button
                          onClick={() => setExplicando(index)}
                          className="text-emerald-500 hover:text-emerald-700 p-2 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="Adicionar descrição"
                        >
                          <i className="fas fa-pen"></i>
                        </button>
                      )}
                      <button
                        onClick={() => onExcluir(paciente.id, index)}
                        className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-colors"
                        title="Excluir"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </div>
                  {explicando === index && (
                    <div className="mt-3">
                      <input
                        type="text"
                        placeholder="O que é este documento?"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && e.target.value.trim()) {
                            onExplicar(paciente.id, index, e.target.value.trim());
                            setExplicando(null);
                          }
                        }}
                        autoFocus
                      />
                      <p className="text-xs text-gray-400 mt-1">Pressione Enter para salvar</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default App;