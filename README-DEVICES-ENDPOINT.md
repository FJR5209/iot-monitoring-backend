# Endpoint de Dispositivos Atualizado

## 📋 Resumo das Mudanças

O endpoint `/api/v1/devices` foi atualizado para incluir automaticamente a **última leitura** e as **últimas 5 leituras** de cada dispositivo.

## 🔄 Mudanças Implementadas

### 1. Função `getAllDevices`
- **Antes**: Retornava apenas os dados básicos do dispositivo
- **Agora**: Inclui `lastReading` e `readings` usando agregação MongoDB

### 2. Função `getDeviceById`
- **Antes**: Retornava apenas os dados básicos do dispositivo
- **Agora**: Inclui `lastReading` e `readings` para o dispositivo específico

## 📊 Estrutura da Resposta

### Exemplo de resposta do endpoint `/api/v1/devices`:

```json
{
  "data": [
    {
      "_id": "684b0814b519347611d18a04",
      "name": "HEMOACRE",
      "deviceKey": "abc123...", // Apenas para admins
      "tenant": "tenant_id",
      "settings": {
        "tempMin": 2,
        "tempMax": 30
      },
      "lastContact": "2025-01-18T15:05:46.102Z",
      "status": "active",
      "lastAlertSent": null,
      "createdAt": "2025-01-18T10:00:00.000Z",
      "updatedAt": "2025-01-18T15:05:46.102Z",
      
      // NOVO: Última leitura
      "lastReading": {
        "temperature": 7.5,
        "humidity": 60,
        "timestamp": "2025-01-18T15:05:46.102Z"
      },
      
      // NOVO: Últimas 5 leituras
      "readings": [
        {
          "temperature": 7.5,
          "humidity": 60,
          "timestamp": "2025-01-18T15:05:46.102Z"
        },
        {
          "temperature": 7.2,
          "humidity": 58,
          "timestamp": "2025-01-18T15:00:46.102Z"
        }
        // ... até 5 leituras
      ]
    }
  ],
  "totalPages": 1,
  "currentPage": 1,
  "totalItems": 1
}
```

## 🚀 Como Usar no Frontend

### 1. Requisição Básica

```javascript
const fetchDevices = async (token) => {
  const response = await axios.get('http://localhost:3000/api/v1/devices', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  return response.data.data; // Array de dispositivos
};
```

### 2. Exibir Última Leitura

```javascript
const DeviceCard = ({ device }) => {
  return (
    <div>
      <h3>{device.name}</h3>
      
      {device.lastReading ? (
        <div>
          <p>🌡️ Temperatura: {device.lastReading.temperature}°C</p>
          <p>💧 Humidade: {device.lastReading.humidity}%</p>
          <p>🕐 {new Date(device.lastReading.timestamp).toLocaleString('pt-BR')}</p>
        </div>
      ) : (
        <p>Nenhuma leitura disponível</p>
      )}
    </div>
  );
};
```

### 3. Calcular Médias das Últimas 5 Leituras

```javascript
const calculateAverages = (device) => {
  if (!device.readings || device.readings.length === 0) {
    return { temperature: 'N/A', humidity: 'N/A' };
  }
  
  const avgTemp = device.readings.reduce((sum, reading) => 
    sum + reading.temperature, 0) / device.readings.length;
    
  const avgHumidity = device.readings.reduce((sum, reading) => 
    sum + (reading.humidity || 0), 0) / device.readings.length;
    
  return {
    temperature: avgTemp.toFixed(1),
    humidity: avgHumidity.toFixed(1)
  };
};
```

## 🔧 Detalhes Técnicos

### Pipeline de Agregação MongoDB

O endpoint usa um pipeline de agregação complexo:

1. **$match**: Filtra dispositivos por tenant e permissões
2. **$lookup**: Busca a última leitura de cada dispositivo
3. **$lookup**: Busca as últimas 5 leituras de cada dispositivo
4. **$addFields**: Formata os dados e inclui deviceKey para admins
5. **$sort**: Ordena por data de criação

### Performance

- **Otimização**: Usa índices no campo `timestamp` da collection `datareadings`
- **Limitação**: Busca apenas as últimas 5 leituras para evitar sobrecarga

### Segurança

- **deviceKey**: Incluído apenas para usuários com role 'admin'
- **Tenant isolation**: Mantida a separação por tenant
- **User permissions**: Respeitadas as permissões de viewer/admin

## 🧪 Testando o Endpoint

### 1. Script de Teste

Execute o arquivo `test-devices-endpoint.js`:

```bash
node test-devices-endpoint.js
```

### 2. Teste Manual com curl

```bash
# 1. Fazer login para obter token
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "password123"}'

# 2. Usar o token para buscar dispositivos
curl -X GET http://localhost:3000/api/v1/devices \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -H "Content-Type: application/json"
```

## 📈 Benefícios

1. **Menos requisições**: Uma única requisição em vez de múltiplas
2. **Dados completos**: Última leitura e histórico incluídos
3. **Performance**: Agregação otimizada no MongoDB
4. **Flexibilidade**: Fácil cálculo de médias no frontend
5. **Consistência**: Dados sempre sincronizados 