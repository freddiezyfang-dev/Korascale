/* experiences 表缺 main_image 时执行：为表补上该列 */

ALTER TABLE experiences ADD COLUMN IF NOT EXISTS main_image VARCHAR(500);

SELECT 'main_image column added' AS message;
