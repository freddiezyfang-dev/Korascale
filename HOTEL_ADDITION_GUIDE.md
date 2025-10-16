# 酒店添加指南

## 方法1：通过管理员后台添加（推荐）

### 步骤：
1. 登录管理员账户：`admin@korascale.com`
2. 访问：`http://localhost:3002/admin/hotels`
3. 点击 "Add New Hotel" 按钮
4. 填写酒店信息表单
5. 提交保存

### 优点：
- 用户友好的界面
- 不需要修改代码
- 实时预览效果
- 数据验证

---

## 方法2：直接修改JSON文件（开发者方式）

### 文件位置：
`/src/data/hotels.json`

### 添加新酒店示例：

```json
{
  "id": "hotel-17",
  "name": "Beijing Forbidden City Hotel",
  "city": "Beijing",
  "location": "Near Forbidden City, Beijing",
  "description": "Luxury hotel offering stunning views of the Forbidden City with traditional Chinese architecture and modern amenities.",
  "rating": "4.9",
  "starRating": "luxury",
  "images": [
    "/images/hotels/beijing-forbidden-1.png",
    "/images/hotels/beijing-forbidden-2.png",
    "/images/hotels/beijing-forbidden-3.png"
  ],
  "roomTypes": [
    {
      "name": "Forbidden City View King Room",
      "description": "Luxurious room with king-size bed (2m) and panoramic Forbidden City views.",
      "amenities": ["WiFi", "Air Conditioning", "Minibar", "Safe", "Forbidden City View", "Balcony"]
    },
    {
      "name": "Forbidden City View Twin Room",
      "description": "Elegant room with two single beds (1.5m each) and city views.",
      "amenities": ["WiFi", "Air Conditioning", "Minibar", "Safe", "Forbidden City View"]
    }
  ]
}
```

### 步骤：
1. 打开 `src/data/hotels.json`
2. 在 `hotels` 数组中添加新酒店对象
3. 确保 `id` 是唯一的（如 `hotel-17`）
4. 添加酒店图片到 `public/images/hotels/` 目录
5. 保存文件，应用会自动重新加载

### 优点：
- 直接修改数据源
- 适合批量添加
- 版本控制友好

---

## 方法3：通过代码添加（程序化）

### 在 HotelManagementContext 中添加方法：

```typescript
const addHotel = (hotelData: Omit<Hotel, 'id' | 'createdAt' | 'updatedAt' | 'status'>) => {
  const newHotel: Hotel = {
    ...hotelData,
    id: `hotel_${Date.now()}`,
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  
  const updatedHotels = [...hotels, newHotel];
  setHotels(updatedHotels);
  saveHotels(updatedHotels);
};
```

### 优点：
- 程序化控制
- 可以添加业务逻辑
- 适合API集成

---

## 图片准备指南

### 图片要求：
- 格式：PNG, JPG, WebP
- 尺寸：建议 800x600 像素
- 命名：`酒店名-序号.png`（如：`beijing-forbidden-1.png`）

### 存放位置：
```
public/images/hotels/
├── beijing-forbidden-1.png
├── beijing-forbidden-2.png
├── beijing-forbidden-3.png
└── ...
```

---

## 酒店字段说明

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | 是 | 唯一标识符 |
| name | string | 是 | 酒店名称 |
| city | string | 是 | 城市 |
| location | string | 是 | 具体位置 |
| description | string | 是 | 酒店描述 |
| rating | string | 否 | 评分（1-5） |
| starRating | string | 否 | 星级（comfortable/upscale/luxury） |
| images | string[] | 是 | 图片URL数组 |
| roomTypes | object[] | 是 | 房型信息数组 |

### 房型字段：
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 是 | 房型名称 |
| description | string | 是 | 房型描述 |
| amenities | string[] | 是 | 设施列表 |

---

## 推荐流程

1. **准备图片**：先准备好酒店图片
2. **使用管理后台**：通过界面添加酒店（推荐）
3. **测试功能**：检查酒店是否正确显示
4. **调整状态**：根据需要激活/停用酒店

这样您就可以轻松添加新酒店了！
