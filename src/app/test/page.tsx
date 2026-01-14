export default function TestPage() {
  return (
    <div style={{ padding: '20px' }}>
      <h1>测试页面</h1>
      <p>如果您能看到这个页面，说明服务器基本工作正常。</p>
      <p>时间: {new Date().toISOString()}</p>
    </div>
  );
}
