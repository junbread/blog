---
title: "이펙티브 자바 12장 정리"
date: 2021-08-16
slug: "/effective-java-12"
tags: ["Study", "Java"]
---

## 아이템 85: 자바 직렬화의 대안을 찾으라

자바 직렬화에는 공격의 소지가 매우 많고, 점점 더 많아지고 있기 때문에 가급적 사용하지 말아야 한다.

### 자바 직렬화를 사용하는 방법

아무것도 역직렬화하지 않는다.

레거시 등으로 어쩔 수 없이 사용하더라도, 신뢰할 수 없는 데이터는 절대 역직렬화하지 않는다.

## 아이템 86: Serializable을 구현할지는 신중히 결정하라

### Serializable 구현의 단점들

- Serializable을 구현하면 릴리즈한 뒤에는 수정하기 어렵다.

    → 직렬화 형태 또한 공개 API가 되기 때문

- 버그와 보안 구멍이 생길 가능성이 높아진다.
- 해당 클래스의 신버전을 릴리즈할 때 테스트해야 할 것이 늘어난다.

### Serializable 구현하면 안 되는 경우

- 상속용으로 설계된 클래스는 Serializable을 구현해서는 안 되고, 인터페이스도 Serializable을 확장해서는 안 된다.

    → 불가피하게 상속 가능 serializable을 구현해야 한다면, finalize 메서드를 재정의하지 못하도록 하자.

- 내부 클래스는 직렬화를 구현하지 말아야 한다.

    → 바깥 인스턴스 참조와 유효 지역변수 값을 저장하기 위해 컴파일러가 임의로 생성한 필드가 들어가기 때문에 직렬화 형태가 일관적이지 않다.

## 아이템 87: 커스텀 직렬화 형태를 고려해보라

객체의 물리적 표현과 논리적 표현이 같다면 기본 직렬화 형태를 유지해도 괜찮지만, 그렇지 않다면 커스텀 직렬화 형태를 고려하자.

### 기본 직렬화 형태에 적합한 클래스

```java
public class Name implements Serializable {
    /**
     * 성. null이 아니어야 한다.
     * @serial
     */
    private final Stirng lastName;

    /**
     * 이름. null이 아니어야 한다.
     * @serial
     */
    private final String firstName;

    /**
     * 중간이름. 중간이름이 없다면 null
     * @serial
     */
    private final String middleName;

    ... // 나머지 코드는 생략
}
```

### 기본 직렬화 형태에 적합하지 않은 클래스

```java
public final class StringList implements Serializable {
    private int size = 0;
    private Entry head = null;

    private static class Entry implements Serializable {
        String data;
        Entry next;
        Entry previous;
    }
}
```

기본 직렬화 형태로 직렬화 시에 양방향 연결 노드를 모두 직렬화하게 된다.

- 공개 api가 현재의 내부 표현 방식에 영구히 묶인다.
- 너무 많은 공간을 차지할 수 있다.
- 시간이 너무 많이 걸릴 수 있다.
- 스택 오버플로를 일으킬 수 있다.

### 직렬화 시에 고려해야 할 것들

- transient 한정자가 붙은 인스턴스 필드는 직렬화되지 않는다.
    - 해당 객체의 논리적 상태와 무관한 필드라고 확신할 때만 transient를 생략하자.
- 객체의 전체 상태를 읽는 메서드에 적용해야 하는 동기화 메커니즘을 직렬화에도 적용해야 한다.
- 어떤 직렬화 형태를 택하든 직렬화 가능 클래스 모두에 직렬 버전 UID를 명시적으로 부여하고, 전 버전과의 호환성을 끊으려는 경우를 제외하고는 수정하지 말자.

## 아이템 88: readObject 메서드는 방어적으로 작성하라

역직렬화 메서드 readObject는 또 다른 public 생성자이기 때문에 불변식을 훼손하지 않도록 방어적으로 작성해야 한다.

객체를 역직렬화할 때는 클라이언트가 소유해서는 안 되는 객체 참조를 가지는 필드를 모두 방어적으로 복사해야 한다.

### 안전한 readObject 메서드를 작성하는 법

- private이어야 하는 객체 참조 필드는 각 필드가 가리키는 객체를 방어적으로 복사하자.
- 모든 불변식을 검사하여 어긋나는 것이 발견되면 InvalidObjectException을 던지자. 방어적 복사 이후에 불변식 검사가 뒤따라야 한다.
- 역직렬화 후 객체 그래프 전체의 유효성을 검사해야 한다면 ObjectInputValidation 인터페이스를 사용하자.
- 직접적이든 간접적이든 재정의할 수 있는 메서드는 호출하면 안 된다.

## 아이템 89: 인스턴스 수를 통제해야 한다면 readResolve보다는 열거 타입을 사용하라

- 싱글턴 클래스는 Serializable을 구현하게 될 경우 인스턴스가 하나임을 보장할 수 없게 된다.
- 이때 readResolve 메서드를 사용하면 readObject가 만들어낸 인스턴스를 다른 것으로 대체할 수 있다.
    - 만약 싱글턴 클래스가 transient로 선언하지 않은 참조 타입 인스턴스 필드를 가지고 있다면, 역직렬화 과정에서 원본 객체가  아닌 인스턴스를 가져올 수 있다.

### 인스턴스 수를 통제하기 위한 방법들

- 컴파일 타임에 인스턴스 필드 값의 종류를 모두 알 수 있다면 자바 언어 자체적으로 인스턴스가 하나임을 보장하는 enum을 사용하자.
- 불가피한 경우에만 readResolve 메서드를 사용하자.
    - 모든 참조 타입 인스턴스 필드를 transient로 선언해야 한다.
    - 상속 가능한 클래스의 경우 readResolve 메서드의 접근자에 주의하자.
        - protected/public이면서 하위 클래스에서 재정의하지 않았으면, 하위 클래스의 역직렬화시 상위 클래스의 인스턴스가 생성될 수 있다.

## 아이템 90: 직렬화된 인스턴스 대신 직렬화 프록시 사용을 검토하라

제 3자가 확장할 수 없는 클래스라면 가능한 한 직렬화 프록시 패턴을 사용하자.

### 직렬화 프록시 패턴 구현하기

- 바깥 클래스의 논리적 상태를 정밀하게 표현하는 중첩 클래스를 private static으로 선언한다.
- 바깥 클래스를 매개변수로 받는 중첩 클래스의 유일한 생성자를 선언한다.
- 바깥 클래스, 직렬화 프록시 모두 Serializable을 구현한다고 선언한다.
- 직렬화 프록시에 readResolve() 메서드를 구현하고, 바깥 클래스에 writeReplace()를 선언한다.

```java
class Period implements Serializable {
    private final Date start;
    private final Date end;

    public Period(Date start, Date end) {
        this.start = start;
        this.end = end;
    }

    private static class SerializationProxy implements Serializable {
        private static final long serialVersionUID = 2123123123;
        private final Date start;
        private final Date end;

        public SerializationProxy(Period p) {
            this.start = p.start;
            this.end = p.end;
        }

        private Object readResolve() {
            return new Period(start, end);
        }
    }

    private Object writeReplace() {
        return new SerializationProxy(this);
    }

    private void readObject(ObjectInputStream stream) throws InvalidObjectException {
        throw new InvalidObjectException("프록시가 필요합니다.");
    }
}
```

### 직렬화 프록시 패턴의 한계

- 확장 가능한 클래스에는 적용할 수 없다.
- 객체 그래프에 순환이 있는 경우에는 적용할 수 없다.
- 방어적 복사하는 경우보다 속도가 느리다.