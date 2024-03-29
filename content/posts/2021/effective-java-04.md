---
title: "이펙티브 자바 4장 정리"
date: 2021-04-05
tags: ["Study", "Java"]
---

## 아이템 15: 클래스와 멤버의 접근 권한을 최소화하라

정보 은닉은 시스템을 구성하는 컴포넌트를 서로 독립시켜 준다. 

- 정보 은닉의 장점
    - 시스템 개발 속도를 높인다. 여러 컴포넌트를 병렬로 개발할 수 있다.
    - 시스템 관리 비용을 낮춘다. 각 컴포넌트를 더 빨리 파악하고, 교체하는 데 부담이 줄어든다.
    - 성능 최적화에 도움을 준다. 각 컴포넌트가 독립되어 있기 때문에 특정 컴포넌트만 최적화가 가능하다.
    - 소프트웨어 재사용성을 높인다. 외부 의존 없이 동작하는 컴포넌트는 다른 환경에서도 사용이 쉽다.
    - 대형 시스템 제작 난이도를 낮춘다. 미완성 상태에서도 개별 컴포넌트 동작을 검증할 수 있다.

### Java의 접근 제한자

- **private**: 클래스 내부에서만 접근 가능
- **package-private** (default): 패키지 내부의 모든 클래스에서 접근 가능
- **protected**: 패키지 내부의 모든 클래스 + 자식 클래스에서 접근 가능
- **public**: 모든 곳에서 접근 가능

### 주의점

- public 클래스는 상수용 public static final 필드 외에 어떠한 public 필드도 가져서는 안 된다.
- public static final 필드의 경우 불변인지 점검해야 한다. ex) 배열
    - 가변 객체를 참조하는 public static final 필드의 내부를 외부에서 변경 가능
    - unmodifiableList를 반환하거나, 복사본을 반환하는 접근자를 제공할 것

```java
private static final Thing[] PRIVATE_VALUES = { ... };
public static final List<Thing> VALUES =
    Collections.unmodifiableList(Arrays.asList(PRIVATE_VALUES));

private static final Thing[] PRIVATE_VALUES = { ... };
public static final Thing[] values() {
    return PRIVATE_VALUES.clone();
}
```

자바 9에서 새로 소개된 모듈에서는 export 되지 않은 모듈 내부의 public, protected 메서드를 모듈 외부에서 사용할 수 없다. 다만 jar 파일의 위치에 따라 무시되는 경우가 있으니 유의해야 한다.

> 요약: 모든 클래스와 멤버의 접근성을 가능한 한 좁혀야 한다.

## 아이템 16: public 클래스에서는 public 필드가 아닌 접근자 메서드를 사용하라

public으로 공개할 클래스라면 내부 필드를 숨기고 접근자(getter) 메서드를 제공하는 것이 좋다.

→ 나중에 클래스의 내부 표현 방식을 언제든 바꿀 수 있기 때문

public 필드가 불변이라면 불변식을 해칠 수 있는 위험성은 덜하지만, 내부 구현을 바꾸기 힘들어진다는 단점은 동일하다.

```java
// 코드 16-3 불변 필드를 노출한 public 클래스 - 과연 좋은가? (103-104쪽)
public final class Time {
    private static final int HOURS_PER_DAY    = 24;
    private static final int MINUTES_PER_HOUR = 60;

    public final int hour;
    public final int minute;

    public Time(int hour, int minute) {
        if (hour < 0 || hour >= HOURS_PER_DAY)
            throw new IllegalArgumentException("Hour: " + hour);
        if (minute < 0 || minute >= MINUTES_PER_HOUR)
            throw new IllegalArgumentException("Min: " + minute);
        this.hour = hour;
        this.minute = minute;
    }
```

package-private, nested private 클래스의 경우, 내부에서만 사용될 것이 보장되기 때문에 노출해도 괜찮다.

Lombok의 @Getter 사용하면 접근자를 편리하게 생성할 수 있다.

> 요약: public 클래스의 경우 필드를 직접 노출하는 대신 접근자를 사용하자.

## 아이템 17: 변경 가능성을 최소화하라

### 불변 객체가 가지는 장점

- 단순하다.
- 본질적으로 스레드 안전하다.
- 안심하고 공유할 수 있다.
- 내부 데이터를 공유할 수 있다.
- 실패 원자성을 제공한다.

### 불변 객체의 단점

값이 다르면 새로운 객체로 만들어야 하기 때문에, 변경하는 데 드는 비용보다 새로운 객체를 만드는 데 훨씬 더 비용이 비싼 경우에는 성능이 하락할 수 있다. ex) BigInteger

→ 이 경우 가변 동반 클래스를 제공하자. ex) String - StringBuilder

### 클래스를 불변으로 만들기

- 객체의 상태를 변경하는 메서드를 제공하지 않는다.
- 클래스를 확장할 수 없도록 한다.
    - 클래스를 final로 선언
    - 모든 생성자를 private, package-private로 선언하고 public 정적 팩터리를 제공
- 모든 필드를 final로 선언한다.
- 모든 필드를 private로 선언한다.
- 자신 외에는 내부의 가변 컴포넌트에 접근할 수 없도록 한다.

- 불변으로 만들 수 없는 객체가 있다고 해도, 변경 가능한 부분을 최소한으로 하자.
- setter 메서드는 꼭 필요한 경우에만 만들자.
- 다른 합당한 이유가 없다면 모든 필드는 private final이어야 한다.
- 생성자는 불변식 설정이 모두 완료된, **초기화가 완벽히 끝난 상태의 객체**를 생성해야 한다.

> 요약: 객체는 되도록 불변으로 만들고, 불가피하게 가변 객체로 만들더라도 변경할 수 있는 부분을 최소화하자.

## 아이템 18: 상속보다는 컴포지션을 사용하라

### 상속의 단점

- 상속은 강력하지만, 캡슐화를 깨뜨린다. 상위 클래스가 어떻게 구현되느냐에 따라 하위 클래스의 동작에 이상이 생길 수 있다.
- 상위 클래스가 확장을 충분히 고려하지 않으면 하위 클래스는 상위 클래스가 변경될 때마다 수정해주어야 한다.

```java
public class InstrumentedHashSet<E> extends HashSet<E> {

    // 추가된 원소의 수
    private int addCount = 0;

    public InstrumentedHashSet() {
    }

    public InstrumentedHashSet(int initCap, float loadFactor) {
	super(initCap, loadFactor);
    }

    @Override public boolean add(E e) {
	addCount++;
	return super.add(e);
    }

    @Override public boolean addAll(Collection<? extends E> c) {
	addCount += c.size();
	return super.addAll(c);
    }

    public int getAddCount() {
	return addCount;
    }
}
```

### **컴포지션**

- 기존 클래스를 확장하는 대신, 새 클래스에 private으로 된 **기존 클래스의 인스턴스를 참조하는 기법**
- 새 클래스는 기존 클래스에 대응하는 메소드를 호출해 결과를 반환한다.
- 새로운 클래스는 기존 클래스의 내부 구현 방식의 영향에서 벗어나며, 기존 클래스에 새 메소드가 추가되어도 전혀 영향받지 않는다.

```java
public class ForwardingSet<E> implements Set<E> {
    private final Set<E> s;
    public ForwardingSet(Set<E> s) { this.s = s; }

    public void clear()                { s.clear(); }
    public boolean contains(Object o)  { return s.contains(o); }
    public boolean isEmpty()           { return s.isEmpty(); }
    public int size()                  { return s.size(); }
    public Iterator<E> iterator()      { return s.iterator(); }
    public boolean add(E e)            { return s.add(e); }
    public boolean containsAll(Collection<?> c)
                                   { return s.containsAll(c); }
    public boolean addAll(Collection<? extends E> c)
                                   { return s.addAll(c); }
    public boolean removeAll(Collection?> c)
                                   { return s.removeAll(c); }
    public boolean retainAll(Collection<?> c)
                                   { return s.retainAll(c); }
    public Object[] toArray()          { return s.toArray(); }
    public <T> T[] toArray(T[] a)      { return s.toArray(a); }
    @Override public boolean equals(Object o)
                                       { return s.equals(o); }
    @Override public int hashCode()    { return s.hashCode(); }
    @Override public String toString() { return s.toString(); }
}
```

```java
public class InstrumentedHashSet<E> extends ForwardingSet<E> {
    private int addCount = 0;

    public InstrumentedHashSet(Set<E> s) {
	super(s);
    }

    @Override public boolean add(E e) {
	addCount++;
	return super.add(e);
    }

    @Override public boolean addAll(Collection<? extends E> c) {
	addCount += c.size();
	return super.addAll(c);
    }

    public int getAddCount() {
	return addCount;
    }
}
```

**상속**은 반드시 하위 클래스가 상위 클래스의 **'진짜' 하위 타입**인 경우에만 쓰여야 한다. B가 A가 아니라면, A를 private 필드로 두고, A와는 다른 API를 제공해야 한다. 즉, A는 B의 필수 구성요소가 아니라 구현하는 방법 중 하나일 뿐이다.

### **상속을 사용하기 전 자문해야 할 것**

- 확장하려는 클래스의 API에 아무런 결함이 없는가?
- 결함이 있다면, 이 결함이 하위 클래스의 API까지 전파되어도 괜찮은가?

> 요약: 상속은 하위 클래스가 상위 클래스의 진짜 하위 타입인 경우에만 사용하고, 그렇지 않을 경우에는 컴포지션을 사용하자.

## 아이템 19: 상속을 고려해 설계하고 문서화하라. 그러지 않았다면 상속을 금지하라

- 상속용 클래스는 재정의할 수 있는 메서드를 내부적으로 어떻게 이용하는지 문서로 남겨야 한다.

→ @implSpec 태그를 붙이면 자바독이 생성해 준다.

- 상속용으로 설계한 클래스는 배포 전에 반드시 하위 클래스를 만들어 검증해야 한다.
- 상속용 클래스의 생성자는 재정의 가능 메서드를 호출해서는 안 된다.

    → 예상치 못한 에러를 발생시킬 수가 있다.

```jsx
public class Super {
    // 잘못된 예 - 생성자가 재정의 가능 메서드를 호출한다.
    public Super() {
        overrideMe();
    }

    public void overrideMe() {
    }
}

public final class Sub extends Super {
    // 초기화되지 않은 final 필드. 생성자에서 초기화한다.
    private final Instant instant;

    Sub() {
        instant = Instant.now();
    }

    // 재정의 가능 메서드. 상위 클래스의 생성자가 호출한다.
    @Override public void overrideMe() {
        System.out.println(instant);
    }

    public static void main(String[] args) {
        Sub sub = new Sub();
        sub.overrideMe();
    }
}
```

- Cloneable과 Serializable을 구현한 클래스의 경우 더 복잡하다.
    - clone, readObject의 경우 새로운 객체를 만들기 때문에 생성자에서 재정의 가능 메서드 호출 금지와 동일한 제약사항을 가진다.
    - Serializable의 경우 상속용 상위 클래스가 readResolve, writeReplace 구현하는 경우 private가 아닌 protected로 선언해야 하위 클래스에서 무시되지 않는다.

> 상속용으로 설계하지 않은 클래스는 상속을 금지하자. 상속을 허용하는 경우는 재정의 가능 메서드의 내부 구현을 상세하게 밝혀야 한다.

## 아이템 20: 추상 클래스보다는 인터페이스를 우선하라

### 다중 구현의 두 가지 방법

추상 클래스, 인터페이스

→ 추상 클래스를 구현하는 클래스는 반드시 추상 클래스의 하위 타입이 되어야 하기 때문에 유연성이 떨어진다.

### 인터페이스가 가지는 장점

- 기존 클래스에도 손쉽게 구현할 수 있다: 추상 클래스의 경우 이미 다른 클래스를 상속받고 있다면 사용할 수 없다.
- 믹스인 정의에 안성맞춤이다.
- 계층구조가 없는 타입 프레임워크를 만들 수 있다.

```java
public interface Singer {
    AudioClip sing(Song s);
}

public interface Songwriter {
    Song compose(int chartPosition);
}

public interface SingerSongwriter extends Singer, SongWriter {
    AudioClip strum();
    void actSensitive();
}
```

- 래퍼 클래스와 함께 사용하면 인터페이스는 기능을 향상시키는 안전하고 강력한 수단이 된다.

```java
public abstract class AbstractMapEntry<K,V>
        implements Map.Entry<K,V> {
    // 변경 가능한 엔트리는 이 메서드를 반드시 재정의해야 한다.
    @Override public V setValue(V value) {
        throw new UnsupportedOperationException();
    }
    
    // Map.Entry.equals의 일반 규약을 구현한다.
    @Override public boolean equals(Object o) {
        if (o == this)
            return true;
        if (!(o instanceof Map.Entry))
            return false;
        Map.Entry<?,?> e = (Map.Entry) o;
        return Objects.equals(e.getKey(),   getKey())
                && Objects.equals(e.getValue(), getValue());
    }

    // Map.Entry.hashCode의 일반 규약을 구현한다.
    @Override public int hashCode() {
        return Objects.hashCode(getKey())
                ^ Objects.hashCode(getValue());
    }

    @Override public String toString() {
        return getKey() + "=" + getValue();
    }
}
```

## 아이템 21: 인터페이스는 구현하는 쪽을 생각해 설계하라

자바 8부터는 **디폴트 메소드**를 지원해 인터페이스에 메소드를 구현할 수 있게 되었다.

### 주의점

- 생각할 수 있는 모든 상황에서 불변식을 해치지 않는 디폴트 메소드를 만드는 것은 어렵다.
- 디폴트 메소드는 컴파일에 성공하더라도, 기존 구현체에 런타임 오류를 발생시킬 수 있다.
- 기존 인터페이스에 디폴트 메소드로 새 메소드를 추가하는 일은 꼭 필요한 경우가 아니면 피해야 한다.

    → 새 인터페이스에서의 디폴트 메소드는 표준적인 메소드 구현을 제공하는 데 아주 유용하다.

## 아이템 22: 인터페이스는 타입을 정의하는 용도로만 사용하라

인터페이스는 자신을 구현한 클래스의 인스턴스를 참조할 수 있는 타입 역할을 한다. 다시 말해, 클래스가 어떤 인터페이스를 구현한다는 것은 **자신의 인스턴스로 무엇을 할 수 있는지 클라이언트에 얘기해주는 것이다.** 인터페이스는 오직 이 용도로만 사용해야 한다.

상수를 공유할 목적으로 다음과 같은 상수 인터페이스를 만드는 경우가 있다.

```java
// 상수 인터페이스 안티패턴 - 사용금지!
public interface PhysicalConstants {
    // 아보가드로 수 (1/몰)
    static final double AVOGADROS_NUMBER   = 6.022_140_857e23;

    // 볼츠만 상수 (J/K)
    static final double BOLTZMANN_CONSTANT = 1.380_648_52e-23;

    // 전자 질량 (kg)
    static final double ELECTRON_MASS      = 9.109_383_56e-31;
}
```

사용자가 편의를 위해 특정 클래스에서 인터페이스를 구현한다면, 해당 클래스와 그 클래스의 하위 클래스의 모든 전역 네임스페이스가 인터페이스 상수로 오염된다.

### 상수를 공개하는 방법

- 특정 클래스나 인터페이스에 강하게 연관된 상수라면, 그 클래스/인터페이스 자체에 추가
(ex. Integer.MAX_VALUE)
- 인스턴스화할 수 없는 유틸리티 클래스에 담아서 공개

# 아이템 23: 태그 달린 클래스보다는 클래스 계층구조를 활용하라

### 태그 달린 클래스

```jsx
class Figure {
		enum Shape { RECTANGLE, CIRCLE };
		
		final Shape shape; //태그 필드

		double length;
		double width;

		double radius;

		Figure(double radius) {
				shape = Shape.CIRCLE;
				this.radius = radius;
		}

		Figure(double length, double width) {
				shape = Shape.RECTANGLE;
				this.length = length;
				this.width = width;
		}

		double area() {
				switch(shape) {
						case RECTANGLE:
								return length * width;
						case CIRCLE:
								return Math.PI * radius * radius;
						case default:
								throw new AssertionError(shape);
				}
		}
}
```

- enum 선언, 태그 필드, switch 문 등 쓸데없는 코드가 많다.
- 여러 구현이 한 클래스에 혼합되어 있어서 가독성이 나쁘고, 메모리를 많이 사용한다.
- 새로운 의미를 추가하기 위해서 수정해야 하는 코드가 많다.

→ 태그 달린 클래스는 장황하고, 오류를 내기 쉽고, 비효율적이다.

### 클래스 계층구조로 변환

```jsx
abstract class Figure {
		abstract double area();
}

class Circle extends Figure {
		final double radius;
		
		Circle(double radius) {
				this.radius = radius;
		}

		@Override
		double area() {
				return Math.PI * radius * radius;
		}
}

class Rectangle extends Figure {
		final double length;
		final double width;

		Rectangle(double length , double width) {
				this.length = length;
				this.width = width;
		}

		@Override
		double area() {
				return length * width;
		}
}
```

- 쓸데없는 코드가 없고 간결하다.
- 컴파일러의 도움을 받을 수 있다.
- 독립적으로 계층구조 확장이 가능하다.

## 아이템 24: 멤버 클래스는 되도록 static으로 만들라

### 중첩 클래스의 종류

- 정적 멤버 클래스
- 비정적 멤버 클래스
- 익명 클래스
- 지역 클래스

비정적 멤버 클래스의 인스턴스는 암묵적으로 바깥 클래스의 인스턴스와 연결된다.

- 그래서 비정적 멤버 클래스의 인스턴스 메소드에서 바깥 인스턴스의 메소드를 호출하거나, 바깥 인스턴스의 참조를 가져올 수 있다.
- 이 과정에서 시간과 메모리 공간이 소비되고, 가비지 컬렉션이 바깥 인스턴스를 수거하지 못했을 경우 메모리 누수가 생길 수 있다.
- 따라서 **중첩 클래스의 인스턴스가 바깥 인스턴스와 독립적으로 존재할 수 있다면 정적 멤버 클래스로 만들어야 한다**. 비정적 멤버 클래스는 바깥 인스턴스 없이 생성될 수 없기 때문이다.

비정적 멤버 클래스 → 어댑터를 정의할 때 자주 쓰인다. 즉, 어떤 클래스의 인스턴스를 감싸 마치 다른 클래스의 인스턴스처럼 보이게 하는 뷰로 사용하는 것이다. 

```java
public class MySet<E> extends AbstractSet<E> {
    ... // 생략

    @Override public Iterator<E> iterator() {
	return new MyIterator();
    }

    private class MyIterator implements Iterator<E> {
	...
    }
}
```

**private 정적 멤버 클래스**는 바깥 클래스가 표현하는 객체의 한 부분(구성요소)을 나타낼 때 쓴다. ex) Map.Entry

### 중첩 클래스를 사용하는 경우

- 메서드 밖에서 사용해야 하거나 메서드 안에 정의하기에 너무 길다면 **멤버 클래스**
    - 멤버 클래스의 인스턴스 각각이 바깥 인스턴스를 참조한다면 **비정적 멤버 클래스**
    - 그렇지 않으면 **정적 멤버 클래스**
- 중첩 클래스가 한 메소드 안에서만 쓰이면서 그 인스턴스를 생성하는 지점이 단 한 곳이고 해당 타입으로 쓰기에 적합한 클래스나 인터페이스가 이미 있다면 **익명 클래스**
- 그렇지 않으면 **지역 클래스**

## 아이템 25: 톱레벨 클래스는 한 파일에 하나만 담으라

소스 파일 하나에는 반드시 톱레벨 클래스를 하나만 담자. 소스 파일을 어떤 순서로 컴파일하냐에 따라 다른 동작을 만들 수 있다.

```jsx
// Utensil.java
class Utensil {
    static final String NAME = "pan";
}

class Dessert {
    static final String NAME = "cake";
}

// Dessert.java
class Utensil {
    static final String NAME = "pot";
}

class Dessert {
    static final String NAME = "pie";
}
```
